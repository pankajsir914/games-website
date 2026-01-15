-- =====================================================
-- MARKET RESULT CACHE TABLE
-- Stores API results temporarily for auto-settlement
-- =====================================================

CREATE TABLE IF NOT EXISTS public.market_result_cache (
  sportsid TEXT NOT NULL,
  gmid TEXT NOT NULL,
  result_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sportsid, gmid)
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_market_result_cache_expires_at 
  ON public.market_result_cache(expires_at);

-- RLS Policy
ALTER TABLE public.market_result_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can view cached results
CREATE POLICY "Anyone can view cached results"
  ON public.market_result_cache FOR SELECT
  USING (true);

-- Only service role can insert/update (via Edge Functions)
-- This is handled by SECURITY DEFINER functions

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_market_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.market_result_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clean_expired_market_cache() TO authenticated;
