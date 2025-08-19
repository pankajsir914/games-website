-- PHASE 1: Critical Data Exposure Fixes

-- 1. Restrict ludo_rooms access to participants only
DROP POLICY IF EXISTS "Users can view all ludo rooms" ON public.ludo_rooms;

CREATE POLICY "Users can view rooms they created or joined"
ON public.ludo_rooms
FOR SELECT
USING (
  auth.uid() = created_by OR 
  (auth.uid())::text = ANY(SELECT jsonb_array_elements_text(players->'user_ids'))
);

-- 2. Add proper RLS to aviator_live_bets (currently has no RLS policies)
ALTER TABLE public.aviator_live_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own live aviator bets"
ON public.aviator_live_bets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own live aviator bets"
ON public.aviator_live_bets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Restrict aviator_chat_messages to authenticated users with rate limiting context
DROP POLICY IF EXISTS "Authenticated users can view aviator chat messages" ON public.aviator_chat_messages;

CREATE POLICY "Users can view recent aviator chat messages"
ON public.aviator_chat_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  created_at >= NOW() - INTERVAL '1 hour'
);

-- 4. Restrict rummy_sessions access to participants only  
DROP POLICY IF EXISTS "Users can view all rummy sessions" ON public.rummy_sessions;

CREATE POLICY "Users can view sessions they created or joined"
ON public.rummy_sessions
FOR SELECT
USING (
  auth.uid() = created_by OR 
  (auth.uid())::text = ANY(SELECT jsonb_array_elements_text(players->'user_ids'))
);

-- PHASE 2: Database Security Hardening

-- 5. Fix all security definer functions to include proper search_path
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_reason text,
  p_game_type text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_new_balance numeric(12,2);
  v_transaction_id uuid;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  
  -- Validate type
  IF p_type NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Type must be credit or debit';
  END IF;
  
  -- Update wallet balance
  IF p_type = 'credit' THEN
    UPDATE public.wallets
    SET current_balance = current_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING current_balance INTO v_new_balance;
  ELSE
    -- Check sufficient balance for debit
    SELECT current_balance INTO v_new_balance
    FROM public.wallets
    WHERE user_id = p_user_id;
    
    IF v_new_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    UPDATE public.wallets
    SET current_balance = current_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING current_balance INTO v_new_balance;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    user_id, amount, type, reason, game_type, session_id
  ) VALUES (
    p_user_id, p_amount, p_type, p_reason, p_game_type, p_session_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$function$;

-- 6. Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(
  p_input text,
  p_max_length integer DEFAULT 255,
  p_allow_html boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_sanitized text;
BEGIN
  -- Return null if input is null
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace
  v_sanitized := TRIM(p_input);
  
  -- Check length
  IF LENGTH(v_sanitized) > p_max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of % characters', p_max_length;
  END IF;
  
  -- Remove HTML tags if not allowed
  IF NOT p_allow_html THEN
    v_sanitized := regexp_replace(v_sanitized, '<[^>]*>', '', 'gi');
  END IF;
  
  -- Remove potentially dangerous content
  v_sanitized := regexp_replace(v_sanitized, '(script|javascript|vbscript|onload|onerror|onclick|eval|expression)', '', 'gi');
  
  -- Remove SQL injection patterns
  v_sanitized := regexp_replace(v_sanitized, '(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)', '', 'gi');
  
  RETURN v_sanitized;
END;
$function$;

-- 7. Secure admin activity logging with enhanced validation
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type text, 
  p_target_type text DEFAULT NULL::text, 
  p_target_id uuid DEFAULT NULL::uuid, 
  p_details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_log_id UUID;
  v_sanitized_action text;
  v_sanitized_target text;
BEGIN
  -- Validate admin role
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can log activities';
  END IF;
  
  -- Sanitize inputs
  v_sanitized_action := public.validate_and_sanitize_input(p_action_type, 100);
  v_sanitized_target := public.validate_and_sanitize_input(p_target_type, 50);
  
  INSERT INTO public.admin_activity_logs (
    admin_id, action_type, target_type, target_id, details, ip_address, user_agent
  ) VALUES (
    auth.uid(), 
    v_sanitized_action, 
    v_sanitized_target, 
    p_target_id, 
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- 8. Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address inet,
  endpoint text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamp with time zone DEFAULT NOW(),
  last_attempt_at timestamp with time zone DEFAULT NOW(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW()
);

ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all rate limit attempts"
ON public.rate_limit_attempts
FOR SELECT
USING (is_admin_user(auth.uid()));

-- 9. Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_endpoint text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_ip_address inet := inet_client_addr();
  v_attempt_count integer;
  v_blocked_until timestamp with time zone;
BEGIN
  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limit_attempts
  WHERE (user_id = v_user_id OR ip_address = v_ip_address)
    AND endpoint = p_endpoint
    AND blocked_until > NOW()
  ORDER BY last_attempt_at DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Count recent attempts
  SELECT COALESCE(SUM(attempt_count), 0) INTO v_attempt_count
  FROM public.rate_limit_attempts
  WHERE (user_id = v_user_id OR ip_address = v_ip_address)
    AND endpoint = p_endpoint
    AND last_attempt_at >= NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- If exceeded, block for 1 hour
  IF v_attempt_count >= p_max_attempts THEN
    INSERT INTO public.rate_limit_attempts (user_id, ip_address, endpoint, attempt_count, blocked_until)
    VALUES (v_user_id, v_ip_address, p_endpoint, 1, NOW() + INTERVAL '1 hour')
    ON CONFLICT (user_id, ip_address, endpoint) DO UPDATE SET
      attempt_count = rate_limit_attempts.attempt_count + 1,
      last_attempt_at = NOW(),
      blocked_until = NOW() + INTERVAL '1 hour';
    
    RETURN false;
  END IF;
  
  -- Record attempt
  INSERT INTO public.rate_limit_attempts (user_id, ip_address, endpoint)
  VALUES (v_user_id, v_ip_address, p_endpoint)
  ON CONFLICT (user_id, ip_address, endpoint) DO UPDATE SET
    attempt_count = rate_limit_attempts.attempt_count + 1,
    last_attempt_at = NOW();
  
  RETURN true;
END;
$function$;

-- 10. Enhanced chat message creation with better validation
CREATE OR REPLACE FUNCTION public.create_aviator_chat_message(
  p_message text, 
  p_message_type text DEFAULT 'user'::text, 
  p_multiplier numeric DEFAULT NULL::numeric, 
  p_amount numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_message_id uuid;
  v_username text;
  v_cleaned_message text;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Enhanced rate limiting check
  IF NOT public.check_rate_limit('aviator_chat', 20, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending another message.';
  END IF;
  
  -- Enhanced input validation
  v_cleaned_message := public.validate_and_sanitize_input(p_message, 200, false);
  
  IF LENGTH(v_cleaned_message) < 1 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Get username with masking for privacy
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
$function$;