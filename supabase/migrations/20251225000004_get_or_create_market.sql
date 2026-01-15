-- =====================================================
-- GET OR CREATE MARKET FUNCTION
-- Race condition safe: Uses INSERT ... ON CONFLICT
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_market(
  p_event_id TEXT,
  p_sport TEXT,
  p_market_name TEXT,
  p_market_type market_category,
  p_selection TEXT DEFAULT NULL,
  p_odds_back NUMERIC DEFAULT NULL,
  p_odds_lay NUMERIC DEFAULT NULL,
  p_rate_yes NUMERIC DEFAULT NULL,
  p_rate_no NUMERIC DEFAULT NULL,
  p_line_value NUMERIC DEFAULT NULL,
  p_sportsid TEXT DEFAULT NULL,
  p_gmid TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Try to find existing market first
  SELECT id INTO v_market_id
  FROM public.sports_markets
  WHERE event_id = p_event_id
    AND market_name = p_market_name
    AND market_type = p_market_type
    AND (
      -- For ODDS markets, also match selection
      (p_market_type = 'odds' AND selection = p_selection)
      OR
      -- For SESSION markets, match line_value (within 0.01 tolerance)
      (p_market_type = 'session' AND ABS(COALESCE(current_line, line_value) - COALESCE(p_line_value, 0)) < 0.01)
    )
    AND status = 'open'
  LIMIT 1;

  -- If market exists, return it
  IF v_market_id IS NOT NULL THEN
    RETURN v_market_id;
  END IF;

  -- Market doesn't exist, create it
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(
    hashtext(format('%s|%s|%s|%s', p_event_id, p_market_name, p_market_type, COALESCE(p_selection, '')))
  );

  -- Check again after acquiring lock (another transaction might have created it)
  SELECT id INTO v_market_id
  FROM public.sports_markets
  WHERE event_id = p_event_id
    AND market_name = p_market_name
    AND market_type = p_market_type
    AND (
      (p_market_type = 'odds' AND selection = p_selection)
      OR
      (p_market_type = 'session' AND ABS(COALESCE(current_line, line_value) - COALESCE(p_line_value, 0)) < 0.01)
    )
    AND status = 'open'
  LIMIT 1;

  -- If still doesn't exist, create it
  IF v_market_id IS NULL THEN
    INSERT INTO public.sports_markets (
      event_id,
      sport,
      market_name,
      market_type,
      selection,
      odds_back,
      odds_lay,
      line_value,
      current_line,
      rate_yes,
      rate_no,
      status,
      sportsid,
      gmid,
      meta
    ) VALUES (
      p_event_id,
      p_sport,
      p_market_name,
      p_market_type,
      p_selection,
      p_odds_back,
      p_odds_lay,
      p_line_value,
      p_line_value, -- current_line = line_value for new markets
      p_rate_yes,
      p_rate_no,
      'open',
      p_sportsid,
      p_gmid,
      jsonb_build_object(
        'created_by', v_user_id,
        'created_at', now()
      )
    ) RETURNING id INTO v_market_id;
  END IF;

  -- If INSERT didn't return ID (due to conflict), fetch the existing one
  IF v_market_id IS NULL THEN
    SELECT id INTO v_market_id
    FROM public.sports_markets
    WHERE event_id = p_event_id
      AND market_name = p_market_name
      AND market_type = p_market_type
      AND (
        (p_market_type = 'odds' AND selection = p_selection)
        OR
        (p_market_type = 'session' AND ABS(COALESCE(current_line, line_value) - COALESCE(p_line_value, 0)) < 0.01)
      )
      AND status = 'open'
    LIMIT 1;
  END IF;

  -- Update odds/rates if market already exists and new values provided
  IF v_market_id IS NOT NULL THEN
    IF p_market_type = 'odds' THEN
      UPDATE public.sports_markets
      SET 
        odds_back = COALESCE(p_odds_back, odds_back),
        odds_lay = COALESCE(p_odds_lay, odds_lay),
        updated_at = now()
      WHERE id = v_market_id
        AND status = 'open';
    ELSIF p_market_type = 'session' THEN
      UPDATE public.sports_markets
      SET 
        rate_yes = COALESCE(p_rate_yes, rate_yes),
        rate_no = COALESCE(p_rate_no, rate_no),
        updated_at = now()
      WHERE id = v_market_id
        AND status = 'open';
    END IF;
  END IF;

  IF v_market_id IS NULL THEN
    RAISE EXCEPTION 'Failed to get or create market';
  END IF;

  RETURN v_market_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_market(
  TEXT, TEXT, TEXT, market_category, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT
) TO authenticated;
