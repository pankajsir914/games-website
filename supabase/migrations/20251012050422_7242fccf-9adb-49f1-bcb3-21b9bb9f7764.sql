-- Create Diamond Casino bets table
CREATE TABLE IF NOT EXISTS public.diamond_casino_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_id TEXT NOT NULL,
  table_name TEXT,
  bet_amount NUMERIC(10,2) NOT NULL,
  bet_type TEXT NOT NULL,
  odds NUMERIC(5,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  payout_amount NUMERIC(10,2),
  round_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Diamond Casino tables snapshot
CREATE TABLE IF NOT EXISTS public.diamond_casino_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT UNIQUE NOT NULL,
  table_name TEXT,
  table_data JSONB,
  player_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.diamond_casino_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_casino_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diamond_casino_bets
CREATE POLICY "Users can view their own diamond casino bets"
  ON public.diamond_casino_bets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diamond casino bets"
  ON public.diamond_casino_bets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all diamond casino bets"
  ON public.diamond_casino_bets
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- RLS Policies for diamond_casino_tables
CREATE POLICY "Anyone can view diamond casino tables"
  ON public.diamond_casino_tables
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage diamond casino tables"
  ON public.diamond_casino_tables
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_diamond_casino_bets_user_id ON public.diamond_casino_bets(user_id);
CREATE INDEX idx_diamond_casino_bets_table_id ON public.diamond_casino_bets(table_id);
CREATE INDEX idx_diamond_casino_bets_status ON public.diamond_casino_bets(status);
CREATE INDEX idx_diamond_casino_bets_created_at ON public.diamond_casino_bets(created_at DESC);
CREATE INDEX idx_diamond_casino_tables_table_id ON public.diamond_casino_tables(table_id);

-- Add trigger for updated_at on bets
CREATE OR REPLACE FUNCTION update_diamond_casino_bets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diamond_casino_bets_timestamp
  BEFORE UPDATE ON public.diamond_casino_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_diamond_casino_bets_updated_at();