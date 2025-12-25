-- =====================================================
-- MARKET SYNC HELPER FUNCTIONS
-- =====================================================

-- Function to auto-sync markets from privatedata API
-- This can be called periodically or triggered by events
CREATE OR REPLACE FUNCTION public.sync_markets_from_api(
  p_event_id TEXT,
  p_sport TEXT,
  p_sid TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check admin permission
  IF NOT public.is_admin_user(v_user_id) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- This function will be called by the Edge Function
  -- The actual API call and parsing happens in the Edge Function
  -- This is just a placeholder for future database-level logic
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Use Edge Function /sports-market-sync/sync endpoint'
  );
END;
$$;

-- Function to get market type from mname
CREATE OR REPLACE FUNCTION public.get_market_type_from_mname(
  p_mname TEXT
)
RETURNS market_category
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_upper_mname TEXT;
BEGIN
  IF p_mname IS NULL THEN
    RETURN NULL;
  END IF;

  v_upper_mname := UPPER(TRIM(p_mname));

  -- ODDS markets
  IF v_upper_mname LIKE '%MATCH_ODDS%' OR
     v_upper_mname LIKE '%TOSS%' OR
     v_upper_mname LIKE '%ODD_EVEN%' OR
     v_upper_mname LIKE '%BOOKMAKER%' OR
     v_upper_mname LIKE '%FANCY_ODDS%' OR
     v_upper_mname LIKE '%WINNER%' THEN
    RETURN 'odds';
  END IF;

  -- SESSION markets
  IF v_upper_mname LIKE '%OVER_RUNS%' OR
     v_upper_mname LIKE '%BALL_RUNS%' OR
     v_upper_mname LIKE '%PARTNERSHIP%' OR
     v_upper_mname LIKE '%PLAYER_RUNS%' OR
     v_upper_mname LIKE '%SESSION_RUNS%' OR
     v_upper_mname LIKE '%OVER%' OR
     v_upper_mname LIKE '%BALL%' THEN
    RETURN 'session';
  END IF;

  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_markets_from_api(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_type_from_mname(TEXT) TO authenticated;

