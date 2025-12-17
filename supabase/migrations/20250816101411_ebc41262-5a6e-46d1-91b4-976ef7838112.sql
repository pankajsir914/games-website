-- Create Teen Patti game tables and related structures

-- Teen Patti tables for multiplayer games
CREATE TABLE public.teen_patti_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  entry_fee NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 5,
  current_players INTEGER NOT NULL DEFAULT 0,
  min_bet NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  max_bet NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teen Patti games (actual game sessions)
CREATE TABLE public.teen_patti_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL,
  game_number INTEGER NOT NULL DEFAULT 1,
  current_pot NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_bet NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_player_turn UUID,
  dealer_position INTEGER NOT NULL DEFAULT 0,
  boot_amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  total_players INTEGER NOT NULL DEFAULT 0,
  active_players JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_state TEXT NOT NULL DEFAULT 'waiting' CHECK (game_state IN ('waiting', 'dealing', 'betting', 'showdown', 'finished')),
  winner_id UUID,
  winning_hand JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teen Patti players in games
CREATE TABLE public.teen_patti_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  user_id UUID NOT NULL,
  seat_number INTEGER NOT NULL,
  chips_in_game NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cards JSONB, -- Three cards dealt to player
  is_blind BOOLEAN NOT NULL DEFAULT true,
  is_folded BOOLEAN NOT NULL DEFAULT false,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  current_bet NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_bet_this_round NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  last_action TEXT,
  last_action_time TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'folded', 'left')),
  UNIQUE(game_id, seat_number),
  UNIQUE(game_id, user_id)
);

-- Teen Patti bets tracking
CREATE TABLE public.teen_patti_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  user_id UUID NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('boot', 'blind', 'chaal', 'pack', 'show', 'sideshow')),
  bet_amount NUMERIC(10,2) NOT NULL,
  pot_amount_before NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  pot_amount_after NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teen Patti game results
CREATE TABLE public.teen_patti_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  user_id UUID NOT NULL,
  final_hand JSONB NOT NULL,
  hand_rank TEXT NOT NULL,
  hand_strength INTEGER NOT NULL,
  tokens_won NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tokens_lost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  final_position INTEGER NOT NULL,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teen_patti_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_patti_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teen_patti_tables
CREATE POLICY "Anyone can view teen patti tables" 
ON public.teen_patti_tables 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create teen patti tables" 
ON public.teen_patti_tables 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Table creators can update their tables" 
ON public.teen_patti_tables 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for teen_patti_games
CREATE POLICY "Players can view games at tables they joined" 
ON public.teen_patti_games 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teen_patti_players tp 
    WHERE tp.game_id = teen_patti_games.id 
    AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for teen_patti_players
CREATE POLICY "Players can view other players in same game" 
ON public.teen_patti_players 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teen_patti_players tp 
    WHERE tp.game_id = teen_patti_players.game_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join teen patti games" 
ON public.teen_patti_players 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own status" 
ON public.teen_patti_players 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for teen_patti_bets
CREATE POLICY "Players can create their own bets" 
ON public.teen_patti_bets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view bets in their games" 
ON public.teen_patti_bets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teen_patti_players tp 
    WHERE tp.game_id = teen_patti_bets.game_id 
    AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for teen_patti_results
CREATE POLICY "Users can view their own results" 
ON public.teen_patti_results 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.teen_patti_games 
ADD CONSTRAINT fk_teen_patti_games_table_id 
FOREIGN KEY (table_id) REFERENCES public.teen_patti_tables(id) ON DELETE CASCADE;

ALTER TABLE public.teen_patti_players 
ADD CONSTRAINT fk_teen_patti_players_game_id 
FOREIGN KEY (game_id) REFERENCES public.teen_patti_games(id) ON DELETE CASCADE;

ALTER TABLE public.teen_patti_bets 
ADD CONSTRAINT fk_teen_patti_bets_game_id 
FOREIGN KEY (game_id) REFERENCES public.teen_patti_games(id) ON DELETE CASCADE;

ALTER TABLE public.teen_patti_bets 
ADD CONSTRAINT fk_teen_patti_bets_player_id 
FOREIGN KEY (player_id) REFERENCES public.teen_patti_players(id) ON DELETE CASCADE;

ALTER TABLE public.teen_patti_results 
ADD CONSTRAINT fk_teen_patti_results_game_id 
FOREIGN KEY (game_id) REFERENCES public.teen_patti_games(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_teen_patti_tables_status ON public.teen_patti_tables(status);
CREATE INDEX idx_teen_patti_games_table_id ON public.teen_patti_games(table_id);
CREATE INDEX idx_teen_patti_games_state ON public.teen_patti_games(game_state);
CREATE INDEX idx_teen_patti_players_game_id ON public.teen_patti_players(game_id);
CREATE INDEX idx_teen_patti_players_user_id ON public.teen_patti_players(user_id);
CREATE INDEX idx_teen_patti_bets_game_id ON public.teen_patti_bets(game_id);
CREATE INDEX idx_teen_patti_results_user_id ON public.teen_patti_results(user_id);

-- Create trigger for updating updated_at columns
CREATE OR REPLACE FUNCTION update_teen_patti_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teen_patti_tables_updated_at 
BEFORE UPDATE ON public.teen_patti_tables 
FOR EACH ROW EXECUTE FUNCTION update_teen_patti_updated_at_column();

CREATE TRIGGER update_teen_patti_games_updated_at 
BEFORE UPDATE ON public.teen_patti_games 
FOR EACH ROW EXECUTE FUNCTION update_teen_patti_updated_at_column();