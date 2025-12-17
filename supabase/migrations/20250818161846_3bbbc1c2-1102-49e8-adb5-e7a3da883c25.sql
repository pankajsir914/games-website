-- Create sports data caching and management tables
CREATE TABLE IF NOT EXISTS public.sports_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  show_live BOOLEAN DEFAULT true,
  show_upcoming BOOLEAN DEFAULT true,
  show_completed BOOLEAN DEFAULT true,
  api_endpoint TEXT,
  refresh_interval INTEGER DEFAULT 30,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sports_settings ENABLE ROW LEVEL SECURITY;

-- Sports settings policies
CREATE POLICY "Sports settings are viewable by everyone" 
ON public.sports_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can modify sports settings" 
ON public.sports_settings FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create sports matches cache table
CREATE TABLE IF NOT EXISTS public.sports_matches_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_type TEXT NOT NULL,
  match_kind TEXT NOT NULL, -- 'live', 'upcoming', 'completed'
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sport_type, match_kind, match_id)
);

-- Enable RLS
ALTER TABLE public.sports_matches_cache ENABLE ROW LEVEL SECURITY;

-- Cache policies
CREATE POLICY "Sports cache is viewable by everyone" 
ON public.sports_matches_cache FOR SELECT USING (true);

CREATE POLICY "Only admins can modify sports cache" 
ON public.sports_matches_cache FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create betting placeholders table
CREATE TABLE IF NOT EXISTS public.sports_betting_odds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_type TEXT NOT NULL,
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL, -- 'match_winner', 'over_under', 'handicap', etc.
  team_name TEXT,
  odds DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sports_betting_odds ENABLE ROW LEVEL SECURITY;

-- Betting odds policies
CREATE POLICY "Betting odds are viewable by everyone" 
ON public.sports_betting_odds FOR SELECT USING (true);

CREATE POLICY "Only admins can modify betting odds" 
ON public.sports_betting_odds FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create mock bets table (for future integration)
CREATE TABLE IF NOT EXISTS public.sports_mock_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sport_type TEXT NOT NULL,
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  team_name TEXT,
  odds_at_bet DECIMAL(5,2) NOT NULL,
  bet_amount DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost', 'cancelled'
  result_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sports_mock_bets ENABLE ROW LEVEL SECURITY;

-- Mock bets policies
CREATE POLICY "Users can view their own mock bets" 
ON public.sports_mock_bets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mock bets" 
ON public.sports_mock_bets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all mock bets" 
ON public.sports_mock_bets FOR SELECT 
USING (is_admin_user(auth.uid()));

-- Insert default sports settings
INSERT INTO public.sports_settings (sport_type, is_enabled, api_endpoint, settings) VALUES
('cricket', true, 'cricScore', '{"leagues": ["IPL", "ODI", "T20", "Test"], "auto_refresh": true}'),
('football', true, 'fixtures', '{"leagues": ["Premier League", "La Liga", "Champions League"], "auto_refresh": true}'),
('hockey', true, 'games', '{"leagues": ["NHL", "Olympics"], "auto_refresh": true}'),
('basketball', true, 'games', '{"leagues": ["NBA", "Olympics"], "auto_refresh": true}'),
('tennis', true, 'matches', '{"tournaments": ["Wimbledon", "US Open", "French Open"], "auto_refresh": true}')
ON CONFLICT (sport_type) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sports_matches_cache_sport_kind ON public.sports_matches_cache(sport_type, match_kind);
CREATE INDEX IF NOT EXISTS idx_sports_matches_cache_expires ON public.sports_matches_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_sports_betting_odds_match ON public.sports_betting_odds(sport_type, match_id);
CREATE INDEX IF NOT EXISTS idx_sports_mock_bets_user ON public.sports_mock_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_mock_bets_match ON public.sports_mock_bets(sport_type, match_id);

-- Create trigger for updated_at
CREATE TRIGGER update_sports_settings_updated_at
  BEFORE UPDATE ON public.sports_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sports_matches_cache_updated_at
  BEFORE UPDATE ON public.sports_matches_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sports_betting_odds_updated_at
  BEFORE UPDATE ON public.sports_betting_odds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sports_mock_bets_updated_at
  BEFORE UPDATE ON public.sports_mock_bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();