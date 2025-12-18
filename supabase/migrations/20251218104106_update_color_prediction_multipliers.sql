-- Update color prediction multipliers: All colors now have 2x multiplier
-- This ensures house edge by selecting winning color based on minimum bets

CREATE OR REPLACE FUNCTION public.place_color_prediction_bet(
  p_round_id UUID,
  p_color TEXT,
  p_bet_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
  v_multiplier NUMERIC(3,2);
BEGIN
  -- Get round details
  SELECT * INTO v_round
  FROM public.color_prediction_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Validate color
  IF p_color NOT IN ('red', 'green', 'violet') THEN
    RAISE EXCEPTION 'Invalid color selection';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 1 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹1';
  END IF;
  
  -- Check if user already has a bet for this round
  IF EXISTS (
    SELECT 1 FROM public.color_prediction_bets 
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
  
  -- Set multiplier (all colors have 2x payout)
  v_multiplier := 2.0;
  
  -- Deduct bet amount from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Color Prediction bet - Period: ' || v_round.period,
    'color_prediction',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.color_prediction_bets (
    user_id, round_id, color, bet_amount, multiplier
  ) VALUES (
    auth.uid(), p_round_id, p_color, p_bet_amount, v_multiplier
  ) RETURNING id INTO v_bet_id;
  
  -- Update round statistics
  UPDATE public.color_prediction_rounds
  SET 
    total_bets_amount = total_bets_amount + p_bet_amount,
    total_players = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.color_prediction_bets
      WHERE round_id = p_round_id
    ),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'color', p_color,
    'multiplier', v_multiplier
  );
END;
$$;

