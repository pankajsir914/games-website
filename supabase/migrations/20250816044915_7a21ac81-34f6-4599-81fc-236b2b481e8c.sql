-- Create or update the place_roulette_bet RPC function with proper European roulette rules
CREATE OR REPLACE FUNCTION public.place_roulette_bet(
  p_round_id uuid,
  p_bet_type text,
  p_bet_value text DEFAULT NULL,
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

-- Create or update the process_roulette_round RPC function
CREATE OR REPLACE FUNCTION public.process_roulette_round(
  p_round_id uuid,
  p_winning_number integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_record record;
  v_bet_record record;
  v_winning_color text;
  v_payout_multiplier numeric;
  v_payout_amount numeric;
  v_total_bets integer := 0;
  v_total_payouts numeric := 0;
  v_house_profit numeric := 0;
BEGIN
  -- Validate winning number
  IF p_winning_number < 0 OR p_winning_number > 36 THEN
    RAISE EXCEPTION 'Invalid winning number. Must be between 0 and 36';
  END IF;
  
  -- Determine winning color (European Roulette rules)
  IF p_winning_number = 0 THEN
    v_winning_color := 'green';
  ELSIF p_winning_number IN (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) THEN
    v_winning_color := 'red';
  ELSE
    v_winning_color := 'black';
  END IF;
  
  -- Get round details
  SELECT * INTO v_round_record
  FROM roulette_rounds
  WHERE id = p_round_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found';
  END IF;
  
  -- Update round with results
  UPDATE roulette_rounds
  SET 
    status = 'completed',
    winning_number = p_winning_number,
    winning_color = v_winning_color,
    spin_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Process all bets for this round
  FOR v_bet_record IN 
    SELECT * FROM roulette_bets 
    WHERE round_id = p_round_id AND status = 'pending'
  LOOP
    v_total_bets := v_total_bets + 1;
    v_payout_multiplier := 0;
    
    -- Calculate payout based on European Roulette rules
    CASE v_bet_record.bet_type
      WHEN 'straight' THEN
        -- Single number bet (35:1)
        IF v_bet_record.bet_value::integer = p_winning_number THEN
          v_payout_multiplier := 35;
        END IF;
      WHEN 'red' THEN
        -- Red color bet (1:1)
        IF v_winning_color = 'red' THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'black' THEN
        -- Black color bet (1:1)
        IF v_winning_color = 'black' THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'even' THEN
        -- Even number bet (1:1, 0 loses)
        IF p_winning_number > 0 AND p_winning_number % 2 = 0 THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'odd' THEN
        -- Odd number bet (1:1, 0 loses)
        IF p_winning_number > 0 AND p_winning_number % 2 = 1 THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'low' THEN
        -- Low numbers 1-18 (1:1, 0 loses)
        IF p_winning_number >= 1 AND p_winning_number <= 18 THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'high' THEN
        -- High numbers 19-36 (1:1, 0 loses)
        IF p_winning_number >= 19 AND p_winning_number <= 36 THEN
          v_payout_multiplier := 1;
        END IF;
      WHEN 'dozen_1' THEN
        -- First dozen 1-12 (2:1)
        IF p_winning_number >= 1 AND p_winning_number <= 12 THEN
          v_payout_multiplier := 2;
        END IF;
      WHEN 'dozen_2' THEN
        -- Second dozen 13-24 (2:1)
        IF p_winning_number >= 13 AND p_winning_number <= 24 THEN
          v_payout_multiplier := 2;
        END IF;
      WHEN 'dozen_3' THEN
        -- Third dozen 25-36 (2:1)
        IF p_winning_number >= 25 AND p_winning_number <= 36 THEN
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_1' THEN
        -- First column (2:1)
        IF p_winning_number > 0 AND (p_winning_number - 1) % 3 = 0 THEN
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_2' THEN
        -- Second column (2:1)
        IF p_winning_number > 0 AND (p_winning_number - 2) % 3 = 0 THEN
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_3' THEN
        -- Third column (2:1)
        IF p_winning_number > 0 AND p_winning_number % 3 = 0 THEN
          v_payout_multiplier := 2;
        END IF;
      ELSE
        v_payout_multiplier := 0;
    END CASE;
    
    -- Calculate total payout (bet amount + winnings)
    v_payout_amount := v_bet_record.bet_amount * (v_payout_multiplier + 1);
    
    -- Update bet status
    UPDATE roulette_bets
    SET 
      status = CASE WHEN v_payout_multiplier > 0 THEN 'won' ELSE 'lost' END,
      payout_amount = v_payout_amount,
      updated_at = NOW()
    WHERE id = v_bet_record.id;
    
    -- Credit wallet if bet won
    IF v_payout_multiplier > 0 THEN
      PERFORM update_wallet_balance(
        v_bet_record.user_id,
        v_payout_amount,
        'credit',
        'Roulette win - Round ' || v_round_record.round_number || ' (' || v_bet_record.bet_type || ')',
        'roulette',
        p_round_id
      );
      
      v_total_payouts := v_total_payouts + v_payout_amount;
    END IF;
  END LOOP;
  
  v_house_profit := (SELECT SUM(bet_amount) FROM roulette_bets WHERE round_id = p_round_id) - v_total_payouts;
  
  RETURN jsonb_build_object(
    'success', true,
    'round_id', p_round_id,
    'round_number', v_round_record.round_number,
    'winning_number', p_winning_number,
    'winning_color', v_winning_color,
    'total_bets', v_total_bets,
    'total_payouts', v_total_payouts,
    'house_profit', v_house_profit
  );
END;
$$;