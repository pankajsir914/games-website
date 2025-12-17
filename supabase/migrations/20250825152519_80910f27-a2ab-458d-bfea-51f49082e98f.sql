-- Create table for managing sports match betting settings
CREATE TABLE IF NOT EXISTS public.sports_match_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  match_data JSONB NOT NULL, -- Store complete match information
  betting_enabled BOOLEAN DEFAULT false,
  min_bet_amount NUMERIC(10,2) DEFAULT 10.00,
  max_bet_amount NUMERIC(10,2) DEFAULT 10000.00,
  commission_rate NUMERIC(5,4) DEFAULT 0.0500,
  is_featured BOOLEAN DEFAULT false,
  custom_odds JSONB DEFAULT NULL, -- Allow custom odds override
  disabled_reason TEXT DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, sport_type)
);

-- Create index for faster lookups
CREATE INDEX idx_sports_match_settings_match_sport ON public.sports_match_settings(match_id, sport_type);
CREATE INDEX idx_sports_match_settings_betting_enabled ON public.sports_match_settings(betting_enabled);
CREATE INDEX idx_sports_match_settings_sport_type ON public.sports_match_settings(sport_type);

-- Add RLS policies
ALTER TABLE public.sports_match_settings ENABLE ROW LEVEL SECURITY;

-- Master admins can manage all match settings
CREATE POLICY "Master admins can manage match settings" ON public.sports_match_settings
  FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

-- Regular admins can view match settings
CREATE POLICY "Admins can view match settings" ON public.sports_match_settings
  FOR SELECT USING (is_admin_user(auth.uid()));

-- Public can view enabled matches only
CREATE POLICY "Public can view enabled matches" ON public.sports_match_settings
  FOR SELECT USING (betting_enabled = true);

-- Create function to toggle match betting
CREATE OR REPLACE FUNCTION public.toggle_match_betting(
  p_match_id TEXT,
  p_sport_type TEXT,
  p_enabled BOOLEAN,
  p_match_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Only master admins can toggle betting
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can manage match betting';
  END IF;

  -- Insert or update match settings
  INSERT INTO public.sports_match_settings (
    match_id,
    sport_type,
    match_data,
    betting_enabled,
    created_by
  ) VALUES (
    p_match_id,
    p_sport_type,
    COALESCE(p_match_data, '{}'::JSONB),
    p_enabled,
    auth.uid()
  )
  ON CONFLICT (match_id, sport_type) DO UPDATE SET
    betting_enabled = EXCLUDED.betting_enabled,
    match_data = COALESCE(EXCLUDED.match_data, sports_match_settings.match_data),
    updated_at = NOW();

  -- Log the activity
  PERFORM log_admin_activity(
    'toggle_match_betting',
    'sports_match',
    NULL,
    jsonb_build_object(
      'match_id', p_match_id,
      'sport_type', p_sport_type,
      'enabled', p_enabled
    )
  );

  SELECT jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'betting_enabled', p_enabled
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

-- Create function to get match betting settings
CREATE OR REPLACE FUNCTION public.get_match_betting_settings(p_sport_type TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only admins can access this
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access match settings';
  END IF;

  RETURN jsonb_build_object(
    'matches', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'match_id', match_id,
          'sport_type', sport_type,
          'match_data', match_data,
          'betting_enabled', betting_enabled,
          'min_bet_amount', min_bet_amount,
          'max_bet_amount', max_bet_amount,
          'commission_rate', commission_rate,
          'is_featured', is_featured,
          'created_at', created_at,
          'updated_at', updated_at
        )
      )
      FROM public.sports_match_settings
      WHERE (p_sport_type IS NULL OR sport_type = p_sport_type)
      ORDER BY updated_at DESC
    )
  );
END;
$function$;