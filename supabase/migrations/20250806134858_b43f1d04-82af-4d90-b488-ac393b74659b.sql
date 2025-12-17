-- Phase 1: Critical Data Exposure Fixes

-- 1. Drop the existing aviator_live_bets view that exposes full usernames
DROP VIEW IF EXISTS public.aviator_live_bets;

-- 2. Create a secure version that masks usernames
CREATE VIEW public.aviator_live_bets AS
SELECT 
  ab.id,
  ab.user_id,
  ab.bet_amount,
  ab.auto_cashout_multiplier,
  ab.cashout_multiplier,
  ab.payout_amount,
  ab.created_at,
  ar.round_number,
  ab.status,
  ar.status as round_status,
  -- Mask username for privacy (show first 2 chars + stars)
  CASE 
    WHEN LENGTH(COALESCE(p.full_name, 'Anonymous')) <= 2 THEN 
      COALESCE(p.full_name, 'Anonymous')
    ELSE 
      LEFT(COALESCE(p.full_name, 'Anonymous'), 2) || REPEAT('*', GREATEST(1, LENGTH(COALESCE(p.full_name, 'Anonymous')) - 2))
  END as username
FROM public.aviator_bets ab
JOIN public.aviator_rounds ar ON ab.round_id = ar.id
LEFT JOIN public.profiles p ON ab.user_id = p.id
WHERE ar.status IN ('betting', 'flying', 'crashed');

-- 3. Add RLS policy to the view (views inherit from base tables but we can add extra protection)
ALTER VIEW public.aviator_live_bets SET (security_barrier = true);

-- 4. Update chat messages RLS to require authentication
DROP POLICY IF EXISTS "Anyone can view aviator chat messages" ON public.aviator_chat_messages;

CREATE POLICY "Authenticated users can view aviator chat messages" 
ON public.aviator_chat_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Add rate limiting function for chat messages
CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_count integer;
BEGIN
  -- Check messages in last minute
  SELECT COUNT(*) INTO v_message_count
  FROM public.aviator_chat_messages
  WHERE user_id = p_user_id 
  AND created_at > now() - interval '1 minute'
  AND message_type = 'user';
  
  -- Allow max 10 messages per minute
  RETURN v_message_count < 10;
END;
$$;

-- 6. Create improved chat message creation function with validation
CREATE OR REPLACE FUNCTION public.create_aviator_chat_message(
  p_message text,
  p_message_type text DEFAULT 'user',
  p_multiplier numeric DEFAULT NULL,
  p_amount numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id uuid;
  v_username text;
  v_cleaned_message text;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check rate limit
  IF NOT public.check_chat_rate_limit(auth.uid()) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending another message.';
  END IF;
  
  -- Validate message length
  IF LENGTH(TRIM(p_message)) < 1 OR LENGTH(TRIM(p_message)) > 200 THEN
    RAISE EXCEPTION 'Message must be between 1 and 200 characters';
  END IF;
  
  -- Basic XSS protection - remove HTML tags and script content
  v_cleaned_message := regexp_replace(TRIM(p_message), '<[^>]*>', '', 'gi');
  v_cleaned_message := regexp_replace(v_cleaned_message, '(script|javascript|vbscript|onload|onerror|onclick)', '', 'gi');
  
  -- Get username with masking
  SELECT 
    CASE 
      WHEN LENGTH(COALESCE(full_name, 'Anonymous')) <= 2 THEN 
        COALESCE(full_name, 'Anonymous')
      ELSE 
        LEFT(COALESCE(full_name, 'Anonymous'), 2) || REPEAT('*', GREATEST(1, LENGTH(COALESCE(full_name, 'Anonymous')) - 2))
    END
  INTO v_username
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Insert message
  INSERT INTO public.aviator_chat_messages (
    user_id, message, message_type, multiplier, amount, username
  ) VALUES (
    auth.uid(), v_cleaned_message, p_message_type, p_multiplier, p_amount, COALESCE(v_username, 'Anonymous')
  ) RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- 7. Fix search paths for existing functions
CREATE OR REPLACE FUNCTION public.place_aviator_bet(p_round_id uuid, p_bet_amount numeric, p_auto_cashout_multiplier numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
BEGIN
  -- Validate bet amount more strictly
  IF p_bet_amount < 10 OR p_bet_amount > 50000 THEN
    RAISE EXCEPTION 'Bet amount must be between ₹10 and ₹50,000';
  END IF;
  
  -- Get round details
  SELECT * INTO v_round
  FROM public.aviator_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Check if user already has a bet for this round
  IF EXISTS (
    SELECT 1 FROM public.aviator_bets 
    WHERE round_id = p_round_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You have already placed a bet for this round';
  END IF;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct bet amount from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Aviator bet - Round: ' || v_round.round_number,
    'aviator',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.aviator_bets (
    user_id, round_id, bet_amount, auto_cashout_multiplier
  ) VALUES (
    auth.uid(), p_round_id, p_bet_amount, p_auto_cashout_multiplier
  ) RETURNING id INTO v_bet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'auto_cashout_multiplier', p_auto_cashout_multiplier
  );
END;
$function$;

-- 8. Fix cashout function search path
CREATE OR REPLACE FUNCTION public.cashout_aviator_bet(p_bet_id uuid, p_current_multiplier numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_bet RECORD;
  v_round RECORD;
  v_payout_amount NUMERIC(10,2);
BEGIN
  -- Validate multiplier
  IF p_current_multiplier < 1.00 OR p_current_multiplier > 1000.00 THEN
    RAISE EXCEPTION 'Invalid multiplier value';
  END IF;
  
  -- Get bet details
  SELECT * INTO v_bet
  FROM public.aviator_bets
  WHERE id = p_bet_id AND user_id = auth.uid() AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or already processed';
  END IF;
  
  -- Get round details
  SELECT * INTO v_round
  FROM public.aviator_rounds
  WHERE id = v_bet.round_id AND status = 'flying';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or not in flying state';
  END IF;
  
  -- Calculate payout
  v_payout_amount := v_bet.bet_amount * p_current_multiplier;
  
  -- Update bet status
  UPDATE public.aviator_bets
  SET 
    status = 'cashed_out',
    cashout_multiplier = p_current_multiplier,
    cashout_time = NOW(),
    payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_bet_id;
  
  -- Credit wallet with payout
  PERFORM public.update_wallet_balance(
    auth.uid(),
    v_payout_amount,
    'credit',
    'Aviator cashout - Round: ' || v_round.round_number || ' at ' || p_current_multiplier || 'x',
    'aviator',
    v_bet.round_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payout_amount', v_payout_amount,
    'cashout_multiplier', p_current_multiplier
  );
END;
$function$;