-- =====================================================
-- MARKET MANAGEMENT FUNCTIONS
-- Suspension, Line Shifts, Settlement
-- =====================================================

-- =====================================================
-- SUSPEND/RESUME MARKET FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.suspend_market(
  p_market_id UUID,
  p_reason suspension_reason DEFAULT 'other',
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get market
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  -- Suspend market
  UPDATE public.sports_markets
  SET 
    is_suspended = true,
    status = 'suspended',
    suspension_reason = p_reason,
    suspended_at = now(),
    updated_at = now()
  WHERE id = p_market_id;

  -- Log suspension
  INSERT INTO public.market_suspension_logs (
    market_id, reason, notes, created_by
  ) VALUES (
    p_market_id, p_reason, p_notes, v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'suspended_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_market(
  p_market_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market RECORD;
  v_user_id UUID;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get market
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.is_suspended = false THEN
    RAISE EXCEPTION 'Market is not suspended';
  END IF;

  -- Resume market
  UPDATE public.sports_markets
  SET 
    is_suspended = false,
    status = 'open',
    suspension_reason = NULL,
    suspended_at = NULL,
    updated_at = now()
  WHERE id = p_market_id;

  -- Update suspension log
  UPDATE public.market_suspension_logs
  SET resumed_at = now()
  WHERE market_id = p_market_id
    AND resumed_at IS NULL
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'resumed_at', now()
  );
END;
$$;

-- =====================================================
-- SESSION MARKET LINE SHIFT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.shift_session_line(
  p_market_id UUID,
  p_new_line NUMERIC,
  p_new_rate_yes NUMERIC DEFAULT NULL,
  p_new_rate_no NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market RECORD;
  v_user_id UUID;
  v_old_line NUMERIC;
  v_line_history JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get market
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.market_type != 'session' THEN
    RAISE EXCEPTION 'Line shift only applicable to SESSION markets';
  END IF;

  IF v_market.status NOT IN ('open', 'suspended') THEN
    RAISE EXCEPTION 'Cannot shift line for market with status: %', v_market.status;
  END IF;

  v_old_line := v_market.current_line;
  v_line_history := COALESCE(v_market.line_history, '[]'::jsonb);

  -- Add to line history
  v_line_history := v_line_history || jsonb_build_object(
    'old_line', v_old_line,
    'new_line', p_new_line,
    'shifted_at', now(),
    'shifted_by', v_user_id
  );

  -- Update market line and rates
  UPDATE public.sports_markets
  SET 
    current_line = p_new_line,
    line_value = p_new_line, -- Also update base line_value
    rate_yes = COALESCE(p_new_rate_yes, rate_yes),
    rate_no = COALESCE(p_new_rate_no, rate_no),
    line_history = v_line_history,
    updated_at = now()
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'old_line', v_old_line,
    'new_line', p_new_line,
    'shifted_at', now()
  );
END;
$$;

-- =====================================================
-- SETTLEMENT ENGINE
-- =====================================================
CREATE OR REPLACE FUNCTION public.settle_market(
  p_market_id UUID,
  p_result_value NUMERIC DEFAULT NULL, -- For SESSION markets
  p_winning_selection TEXT DEFAULT NULL, -- For ODDS markets
  p_settlement_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market RECORD;
  v_user_id UUID;
  v_bet RECORD;
  v_is_win BOOLEAN;
  v_profit_loss NUMERIC(12,2);
  v_settled_count INTEGER := 0;
  v_total_payout NUMERIC(12,2) := 0;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get market
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.status = 'settled' THEN
    RAISE EXCEPTION 'Market already settled';
  END IF;

  -- Validate settlement data based on market type
  IF v_market.market_type = 'odds' THEN
    IF p_winning_selection IS NULL THEN
      RAISE EXCEPTION 'winning_selection required for ODDS market settlement';
    END IF;
    IF p_winning_selection != v_market.selection THEN
      RAISE EXCEPTION 'Winning selection does not match market selection';
    END IF;
  ELSIF v_market.market_type = 'session' THEN
    IF p_result_value IS NULL THEN
      RAISE EXCEPTION 'result_value required for SESSION market settlement';
    END IF;
  END IF;

  -- Update market status
  UPDATE public.sports_markets
  SET 
    status = 'settled',
    result_value = p_result_value,
    winning_selection = p_winning_selection,
    settled_at = now(),
    updated_at = now()
  WHERE id = p_market_id;

  -- Settle all bets
  FOR v_bet IN 
    SELECT * FROM public.sports_market_bets
    WHERE market_id = p_market_id
      AND status = 'placed'
    FOR UPDATE
  LOOP
    v_is_win := false;
    v_profit_loss := 0;

    -- Determine win/loss based on market type
    IF v_market.market_type = 'odds' THEN
      -- ODDS market: back wins if selection wins, lay wins if selection loses
      IF v_bet.bet_side = 'back' THEN
        v_is_win := true; -- Back bet wins (selection won)
        v_profit_loss := v_bet.potential_profit;
      ELSIF v_bet.bet_side = 'lay' THEN
        v_is_win := false; -- Lay bet loses (selection won)
        v_profit_loss := -v_bet.exposure;
      END IF;

    ELSIF v_market.market_type = 'session' THEN
      -- SESSION market: YES wins if actual > line, NO wins if actual <= line
      IF v_bet.bet_side = 'yes' THEN
        v_is_win := p_result_value > v_bet.line_at_bet;
        IF v_is_win THEN
          v_profit_loss := v_bet.potential_profit;
        ELSE
          v_profit_loss := -v_bet.stake;
        END IF;
      ELSIF v_bet.bet_side = 'no' THEN
        v_is_win := p_result_value <= v_bet.line_at_bet;
        IF v_is_win THEN
          v_profit_loss := v_bet.potential_profit;
        ELSE
          v_profit_loss := -v_bet.exposure;
        END IF;
      END IF;
    END IF;

    -- Update bet status
    UPDATE public.sports_market_bets
    SET 
      status = CASE WHEN v_is_win THEN 'won' ELSE 'lost' END,
      profit_loss = v_profit_loss,
      settled_at = now(),
      settlement_reason = p_settlement_notes
    WHERE id = v_bet.id;

    -- Credit wallet if won
    IF v_is_win THEN
      PERFORM public.update_wallet_balance(
        v_bet.user_id,
        v_bet.stake + v_bet.potential_profit, -- Return stake + profit
        'credit',
        format('Market bet win - %s', v_market.market_name),
        NULL,
        NULL
      );
      v_total_payout := v_total_payout + (v_bet.stake + v_bet.potential_profit);
    END IF;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'settled_bets', v_settled_count,
    'total_payout', v_total_payout,
    'settled_at', now()
  );
END;
$$;

-- =====================================================
-- VOID/REFUND FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.void_market(
  p_market_id UUID,
  p_reason TEXT DEFAULT 'Match abandoned or incomplete'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market RECORD;
  v_user_id UUID;
  v_bet RECORD;
  v_refunded_count INTEGER := 0;
  v_total_refund NUMERIC(12,2) := 0;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get market
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.status = 'settled' THEN
    RAISE EXCEPTION 'Cannot void already settled market';
  END IF;

  IF v_market.status = 'void' THEN
    RAISE EXCEPTION 'Market already voided';
  END IF;

  -- Update market status
  UPDATE public.sports_markets
  SET 
    status = 'void',
    updated_at = now()
  WHERE id = p_market_id;

  -- Refund all bets
  FOR v_bet IN 
    SELECT * FROM public.sports_market_bets
    WHERE market_id = p_market_id
      AND status = 'placed'
    FOR UPDATE
  LOOP
    -- Refund exposure (stake for back/yes, liability for lay/no)
    PERFORM public.update_wallet_balance(
      v_bet.user_id,
      v_bet.exposure,
      'credit',
      format('Market void refund - %s', v_market.market_name),
      NULL,
      NULL
    );

    -- Update bet status
    UPDATE public.sports_market_bets
    SET 
      status = 'void',
      profit_loss = 0,
      settled_at = now(),
      settlement_reason = p_reason
    WHERE id = v_bet.id;

    v_total_refund := v_total_refund + v_bet.exposure;
    v_refunded_count := v_refunded_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'refunded_bets', v_refunded_count,
    'total_refund', v_total_refund,
    'voided_at', now()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.suspend_market(UUID, suspension_reason, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_market(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shift_session_line(UUID, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_market(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_market(UUID, TEXT) TO authenticated;

