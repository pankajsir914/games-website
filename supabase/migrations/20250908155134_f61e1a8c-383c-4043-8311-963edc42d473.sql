-- Create sports SID configurations table
CREATE TABLE IF NOT EXISTS public.sports_sid_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_type TEXT NOT NULL UNIQUE,
  sid TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sports_sid_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view active sports configs" 
ON public.sports_sid_configs 
FOR SELECT 
USING (is_active = true);

-- Create policy for admin management
CREATE POLICY "Admins can manage sports configs" 
ON public.sports_sid_configs 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Insert default SID configurations
INSERT INTO public.sports_sid_configs (sport_type, sid, label, is_active, is_default, display_order, icon) VALUES
('cricket', '4', 'Cricket', true, true, 1, '🏏'),
('football', '1', 'Football', true, false, 2, '⚽'),
('tennis', '2', 'Tennis', true, false, 3, '🎾'),
('basketball', '7', 'Basketball', true, false, 4, '🏀'),
('hockey', '8', 'Hockey', true, false, 5, '🏒'),
('baseball', '3', 'Baseball', true, false, 6, '⚾'),
('kabaddi', '5', 'Kabaddi', true, false, 7, '🤼'),
('boxing', '6', 'Boxing', true, false, 8, '🥊')
ON CONFLICT (sport_type) DO UPDATE SET
  sid = EXCLUDED.sid,
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create an index for performance
CREATE INDEX idx_sports_sid_configs_active ON public.sports_sid_configs(is_active, display_order);
CREATE INDEX idx_sports_sid_configs_sport_type ON public.sports_sid_configs(sport_type);