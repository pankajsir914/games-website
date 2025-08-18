-- Create CricAPI-backed sports tables
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  status TEXT,
  date TIMESTAMP WITH TIME ZONE,
  type TEXT,
  unique_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team1_score TEXT,
  team2_score TEXT,
  result TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Matches readable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Scores readable by everyone" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Players readable by everyone" ON public.players FOR SELECT USING (true);

-- No public write policies (service role bypasses RLS)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_unique_id ON public.matches(unique_id);
CREATE INDEX IF NOT EXISTS idx_scores_match_id ON public.scores(match_id);
CREATE INDEX IF NOT EXISTS idx_players_pid ON public.players(pid);

-- updated_at triggers
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();