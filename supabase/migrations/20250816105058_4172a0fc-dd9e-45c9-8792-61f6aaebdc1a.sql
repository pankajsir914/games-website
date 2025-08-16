-- Drop existing Teen Patti tables and recreate for round-based system
DROP TABLE IF EXISTS teen_patti_bets CASCADE;
DROP TABLE IF EXISTS teen_patti_players CASCADE;
DROP TABLE IF EXISTS teen_patti_games CASCADE;
DROP TABLE IF EXISTS teen_patti_results CASCADE;

-- Create Teen Patti rounds table for continuous rounds
CREATE TABLE public.teen_patti_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  bet_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  result_time TIMESTAMP WITH TIME ZONE,
  winning_cards JSONB,
  winning_hand_rank TEXT,
  total_pot NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'processing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Teen Patti bets table
CREATE TABLE public.teen_patti_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  round_id UUID NOT NULL REFERENCES teen_patti_rounds(id),
  bet_amount NUMERIC(10,2) NOT NULL,
  payout_amount NUMERIC(10,2),
  multiplier NUMERIC(4,2) DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Teen Patti results table for storing round results
CREATE TABLE public.teen_patti_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES teen_patti_rounds(id),
  player_cards JSONB NOT NULL, -- Random 3 cards dealt to players
  winning_hand TEXT NOT NULL,
  winning_cards JSONB NOT NULL,
  hand_strength INTEGER NOT NULL,
  total_bets NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_winners INTEGER NOT NULL DEFAULT 0,
  house_edge NUMERIC(4,4) NOT NULL DEFAULT 0.05,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teen_patti_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teen_patti_rounds
CREATE POLICY "Anyone can view teen patti rounds" ON public.teen_patti_rounds
  FOR SELECT USING (true);

-- RLS Policies for teen_patti_bets
CREATE POLICY "Users can create their own teen patti bets" ON public.teen_patti_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own teen patti bets" ON public.teen_patti_bets
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for teen_patti_results
CREATE POLICY "Anyone can view teen patti results" ON public.teen_patti_results
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_teen_patti_rounds_status ON teen_patti_rounds(status);
CREATE INDEX idx_teen_patti_rounds_round_number ON teen_patti_rounds(round_number);
CREATE INDEX idx_teen_patti_bets_user_id ON teen_patti_bets(user_id);
CREATE INDEX idx_teen_patti_bets_round_id ON teen_patti_bets(round_id);

-- Create sequence for round numbers
CREATE SEQUENCE teen_patti_round_sequence START 1;

-- Add trigger for updated_at
CREATE TRIGGER update_teen_patti_rounds_updated_at_column
  BEFORE UPDATE ON teen_patti_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teen_patti_bets_updated_at_column
  BEFORE UPDATE ON teen_patti_bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();