-- Create table for Diamond sports provider configuration
CREATE TABLE IF NOT EXISTS public.diamond_sports_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_type TEXT NOT NULL,
  sid TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT false,
  sync_interval INTEGER DEFAULT 60, -- in seconds
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(sport_type, sid)
);

-- Create table for Diamond match results management
CREATE TABLE IF NOT EXISTS public.diamond_match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  event_id TEXT,
  market_id TEXT,
  selection_id TEXT,
  sport_type TEXT NOT NULL,
  result_status TEXT CHECK (result_status IN ('pending', 'win', 'loss', 'void', 'refund')),
  result_data JSONB,
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, market_id, selection_id)
);

-- Create table for API endpoint test logs
CREATE TABLE IF NOT EXISTS public.diamond_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  params JSONB,
  response JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  tested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_diamond_sports_config_sport ON public.diamond_sports_config(sport_type);
CREATE INDEX IF NOT EXISTS idx_diamond_sports_config_active ON public.diamond_sports_config(is_active);
CREATE INDEX IF NOT EXISTS idx_diamond_match_results_match ON public.diamond_match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_diamond_match_results_sport ON public.diamond_match_results(sport_type);
CREATE INDEX IF NOT EXISTS idx_diamond_api_logs_endpoint ON public.diamond_api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_diamond_api_logs_created ON public.diamond_api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.diamond_sports_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diamond_sports_config
CREATE POLICY "Master admins can manage Diamond sports config" 
ON public.diamond_sports_config 
FOR ALL 
USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can view Diamond sports config" 
ON public.diamond_sports_config 
FOR SELECT 
USING (is_admin_user(auth.uid()));

-- RLS Policies for diamond_match_results  
CREATE POLICY "Master admins can manage Diamond match results" 
ON public.diamond_match_results 
FOR ALL 
USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can view Diamond match results" 
ON public.diamond_match_results 
FOR SELECT 
USING (is_admin_user(auth.uid()));

-- RLS Policies for diamond_api_logs
CREATE POLICY "Master admins can manage Diamond API logs" 
ON public.diamond_api_logs 
FOR ALL 
USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can view Diamond API logs" 
ON public.diamond_api_logs 
FOR SELECT 
USING (is_admin_user(auth.uid()));

-- Update existing sports_match_settings to include Diamond-specific fields
ALTER TABLE public.sports_match_settings 
ADD COLUMN IF NOT EXISTS diamond_event_id TEXT,
ADD COLUMN IF NOT EXISTS diamond_market_id TEXT,
ADD COLUMN IF NOT EXISTS diamond_data JSONB,
ADD COLUMN IF NOT EXISTS odds_data JSONB;

-- Create function to manage Diamond sports SIDs
CREATE OR REPLACE FUNCTION public.manage_diamond_sports_sid(
  p_sport_type TEXT,
  p_sid TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true,
  p_auto_sync BOOLEAN DEFAULT false,
  p_sync_interval INTEGER DEFAULT 60
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only master admins can manage SIDs
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can manage Diamond sports SIDs';
  END IF;

  -- Insert or update SID configuration
  INSERT INTO public.diamond_sports_config (
    sport_type,
    sid,
    is_active,
    auto_sync,
    sync_interval,
    created_by
  ) VALUES (
    p_sport_type,
    p_sid,
    p_is_active,
    p_auto_sync,
    p_sync_interval,
    auth.uid()
  )
  ON CONFLICT (sport_type, sid) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    auto_sync = EXCLUDED.auto_sync,
    sync_interval = EXCLUDED.sync_interval,
    updated_at = NOW();

  -- Log the activity
  PERFORM log_admin_activity(
    'manage_diamond_sid',
    'sports_config',
    NULL,
    jsonb_build_object(
      'sport_type', p_sport_type,
      'sid', p_sid,
      'is_active', p_is_active,
      'auto_sync', p_auto_sync
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'sport_type', p_sport_type,
    'sid', p_sid
  );
END;
$$;

-- Create function to post Diamond match results
CREATE OR REPLACE FUNCTION public.post_diamond_match_result(
  p_match_id TEXT,
  p_market_id TEXT,
  p_selection_id TEXT,
  p_result TEXT,
  p_sport_type TEXT,
  p_event_id TEXT DEFAULT NULL,
  p_result_data JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result_id UUID;
BEGIN
  -- Only master admins can post results
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can post match results';
  END IF;

  -- Insert or update match result
  INSERT INTO public.diamond_match_results (
    match_id,
    event_id,
    market_id,
    selection_id,
    sport_type,
    result_status,
    result_data,
    posted_at,
    posted_by
  ) VALUES (
    p_match_id,
    p_event_id,
    p_market_id,
    p_selection_id,
    p_sport_type,
    p_result,
    p_result_data,
    NOW(),
    auth.uid()
  )
  ON CONFLICT (match_id, market_id, selection_id) DO UPDATE SET
    result_status = EXCLUDED.result_status,
    result_data = EXCLUDED.result_data,
    posted_at = NOW(),
    posted_by = auth.uid(),
    updated_at = NOW()
  RETURNING id INTO v_result_id;

  -- Log the activity
  PERFORM log_admin_activity(
    'post_diamond_result',
    'match_result',
    v_result_id,
    jsonb_build_object(
      'match_id', p_match_id,
      'market_id', p_market_id,
      'selection_id', p_selection_id,
      'result', p_result
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'result_id', v_result_id,
    'match_id', p_match_id
  );
END;
$$;

-- Create function to log Diamond API endpoint tests
CREATE OR REPLACE FUNCTION public.log_diamond_api_test(
  p_endpoint TEXT,
  p_method TEXT DEFAULT 'GET',
  p_params JSONB DEFAULT NULL,
  p_response JSONB DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Only admins can test endpoints
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can test Diamond API endpoints';
  END IF;

  INSERT INTO public.diamond_api_logs (
    endpoint,
    method,
    params,
    response,
    status_code,
    response_time_ms,
    tested_by
  ) VALUES (
    p_endpoint,
    p_method,
    p_params,
    p_response,
    p_status_code,
    p_response_time_ms,
    auth.uid()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;