-- Fix place_sports_bet to use correct update_wallet_balance signature
CREATE OR REPLACE FUNCTION public.place_sports_bet(
  p_sport TEXT,
  p_event_id TEXT,
  p_market_type TEXT,
  p_selection TEXT,
  p_bet_type TEXT,
  p_odds NUMERIC,
  p_stake NUMERIC,
  p_provider TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_balance NUMERIC(12,2);
  v_bet_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_stake <= 0 THEN
    RAISE EXCEPTION 'Stake must be greater than 0';
  END IF;

  IF p_odds <= 1 THEN
    RAISE EXCEPTION 'Odds must be greater than 1';
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance IS NULL OR v_wallet_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Debit wallet (session_id not applicable here, pass NULL)
  PERFORM public.update_wallet_balance(
    v_user_id,
    p_stake,
    'debit',
    'Sports bet - ' || coalesce(p_sport, 'sport') || ' ' || coalesce(p_event_id, ''),
    'casino',
    NULL::uuid
  );

  -- Insert bet
  INSERT INTO public.sports_bets (
    user_id, sport, event_id, market_type, selection, bet_type, odds, stake, potential_win, provider, meta
  ) VALUES (
    v_user_id, p_sport, p_event_id, p_market_type, p_selection, p_bet_type, p_odds, p_stake,
    CASE 
      WHEN p_bet_type = 'lay' THEN p_stake -- lay wins stake
      ELSE p_stake * p_odds
    END,
    p_provider,
    p_meta
  )
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id
  );
END;
$$;


