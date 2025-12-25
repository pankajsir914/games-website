-- =====================================================
-- MARKET CREATION HELPER FUNCTIONS
-- =====================================================

-- Function to create an ODDS market
CREATE OR REPLACE FUNCTION public.create_odds_market(
  p_event_id TEXT,
  p_sport TEXT,
  p_market_name TEXT,
  p_selection TEXT,
  p_odds_back NUMERIC,
  p_odds_lay NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Validate inputs
  IF p_odds_back <= 1 THEN
    RAISE EXCEPTION 'Back odds must be greater than 1';
  END IF;

  IF p_odds_lay IS NOT NULL AND p_odds_lay <= 1 THEN
    RAISE EXCEPTION 'Lay odds must be greater than 1';
  END IF;

  -- Create market
  INSERT INTO public.sports_markets (
    event_id,
    sport,
    market_name,
    market_type,
    selection,
    odds_back,
    odds_lay,
    status,
    current_line
  ) VALUES (
    p_event_id,
    p_sport,
    p_market_name,
    'odds',
    p_selection,
    p_odds_back,
    p_odds_lay,
    'open',
    NULL
  ) RETURNING id INTO v_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', v_market_id
  );
END;
$$;

-- Function to create a SESSION market
CREATE OR REPLACE FUNCTION public.create_session_market(
  p_event_id TEXT,
  p_sport TEXT,
  p_market_name TEXT,
  p_line_value NUMERIC,
  p_rate_yes NUMERIC,
  p_rate_no NUMERIC
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Validate inputs
  IF p_rate_yes <= 0 OR p_rate_no <= 0 THEN
    RAISE EXCEPTION 'Rates must be greater than 0';
  END IF;

  -- Create market
  INSERT INTO public.sports_markets (
    event_id,
    sport,
    market_name,
    market_type,
    line_value,
    current_line,
    rate_yes,
    rate_no,
    status
  ) VALUES (
    p_event_id,
    p_sport,
    p_market_name,
    'session',
    p_line_value,
    p_line_value,
    p_rate_yes,
    p_rate_no,
    'open'
  ) RETURNING id INTO v_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', v_market_id
  );
END;
$$;

-- Function to update ODDS market odds
CREATE OR REPLACE FUNCTION public.update_odds_market(
  p_market_id UUID,
  p_odds_back NUMERIC DEFAULT NULL,
  p_odds_lay NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market RECORD;
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
  WHERE id = p_market_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.market_type != 'odds' THEN
    RAISE EXCEPTION 'Market is not an ODDS market';
  END IF;

  -- Update odds
  UPDATE public.sports_markets
  SET 
    odds_back = COALESCE(p_odds_back, odds_back),
    odds_lay = COALESCE(p_odds_lay, odds_lay),
    updated_at = now()
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id
  );
END;
$$;

-- Function to update SESSION market rates
CREATE OR REPLACE FUNCTION public.update_session_rates(
  p_market_id UUID,
  p_rate_yes NUMERIC DEFAULT NULL,
  p_rate_no NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market RECORD;
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
  WHERE id = p_market_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  IF v_market.market_type != 'session' THEN
    RAISE EXCEPTION 'Market is not a SESSION market';
  END IF;

  -- Update rates
  UPDATE public.sports_markets
  SET 
    rate_yes = COALESCE(p_rate_yes, rate_yes),
    rate_no = COALESCE(p_rate_no, rate_no),
    updated_at = now()
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_odds_market(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_session_market(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_odds_market(UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_rates(UUID, NUMERIC, NUMERIC) TO authenticated;

