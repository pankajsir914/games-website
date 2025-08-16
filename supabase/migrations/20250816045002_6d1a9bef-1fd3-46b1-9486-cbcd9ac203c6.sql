-- Create or update the place_roulette_bet RPC function with proper European roulette rules
CREATE OR REPLACE FUNCTION public.place_roulette_bet(
  p_round_id uuid,
  p_bet_type text,
  p_bet_value text,
  p_bet_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_round_record record;
  v_wallet_balance numeric;
  v_bet_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 1 OR p_bet_amount > 10000 THEN
    RAISE EXCEPTION 'Bet amount must be between ₹1 and ₹10,000';
  END IF;
  
  -- Get round details and check if betting is allowed
  SELECT * INTO v_round_record
  FROM roulette_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period has ended';
  END IF;
  
  -- Check if user already has a bet for this round and bet type
  IF EXISTS (
    SELECT 1 FROM roulette_bets 
    WHERE round_id = p_round_id AND user_id = v_user_id AND bet_type = p_bet_type 
    AND (bet_value = p_bet_value OR (bet_value IS NULL AND p_bet_value IS NULL))
  ) THEN
    RAISE EXCEPTION 'You already have a bet of this type for this round';
  END IF;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current balance: ₹%.2f', v_wallet_balance;
  END IF;
  
  -- Deduct bet amount from wallet
  PERFORM update_wallet_balance(
    v_user_id,
    p_bet_amount,
    'debit',
    'Roulette bet - Round ' || v_round_record.round_number || ' (' || p_bet_type || ')',
    'roulette',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO roulette_bets (
    user_id, round_id, bet_type, bet_value, bet_amount, status
  ) VALUES (
    v_user_id, p_round_id, p_bet_type, p_bet_value, p_bet_amount, 'pending'
  ) RETURNING id INTO v_bet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'message', 'Bet placed successfully'
  );
END;
$$;