-- Create table for Diamond Sports SID configurations if it doesn't exist
CREATE TABLE IF NOT EXISTS public.diamond_sports_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_type TEXT NOT NULL,
  sid TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diamond_sports_config ENABLE ROW LEVEL SECURITY;

-- Allow public to read configurations
CREATE POLICY "Public can view active SID configs" 
  ON public.diamond_sports_config 
  FOR SELECT 
  USING (is_active = true);

-- Only admins can manage SID configurations
CREATE POLICY "Admins can manage SID configs" 
  ON public.diamond_sports_config 
  FOR ALL 
  USING (is_admin_user(auth.uid()));

-- Insert default SID configurations for all sports
INSERT INTO public.diamond_sports_config (sport_type, sid, is_active, is_default, label)
VALUES 
  ('cricket', '4', true, true, 'Cricket'),
  ('football', '1', true, true, 'Soccer'),
  ('tennis', '2', true, true, 'Tennis'),
  ('basketball', '7', true, false, 'Basketball'),
  ('hockey', '13', true, false, 'Ice Hockey'),
  ('kabaddi', '52', true, false, 'Kabaddi'),
  ('baseball', '3', true, false, 'Baseball'),
  ('table-tennis', '92', true, false, 'Table Tennis'),
  ('boxing', '31', true, false, 'Boxing')
ON CONFLICT DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_diamond_sports_config_sport_type 
  ON public.diamond_sports_config(sport_type);

CREATE INDEX IF NOT EXISTS idx_diamond_sports_config_active 
  ON public.diamond_sports_config(is_active) 
  WHERE is_active = true;