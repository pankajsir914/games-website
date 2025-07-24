
-- Create poker_tables table for game tables
CREATE TABLE public.poker_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_type TEXT NOT NULL DEFAULT 'public', -- public, private
  max_players INTEGER NOT NULL DEFAULT 6,
  current_players INTEGER NOT NULL DEFAULT 0,
  small_blind NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  big_blind NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  buy_in_min NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  buy_in_max NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, paused
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poker_players table for players at tables
CREATE TABLE public.poker_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.poker_tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  seat_number INTEGER NOT NULL, -- 1-6
  chip_count NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, folded, all_in, sitting_out
  is_dealer BOOLEAN NOT NULL DEFAULT false,
  is_small_blind BOOLEAN NOT NULL DEFAULT false,
  is_big_blind BOOLEAN NOT NULL DEFAULT false,
  hole_cards JSONB, -- [{suit: 'hearts', rank: 'A'}, {suit: 'spades', rank: 'K'}]
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, seat_number),
  UNIQUE(table_id, user_id)
);

-- Create poker_games table for individual game sessions
CREATE TABLE public.poker_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.poker_tables(id) ON DELETE CASCADE,
  game_state TEXT NOT NULL DEFAULT 'preflop', -- preflop, flop, turn, river, showdown, completed
  community_cards JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of cards
  deck JSONB NOT NULL DEFAULT '[]'::jsonb, -- Shuffled deck
  pot_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_bet NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_player_turn UUID REFERENCES auth.users(id),
  dealer_position INTEGER NOT NULL DEFAULT 1,
  turn_timer_start TIMESTAMP WITH TIME ZONE,
  turn_time_limit INTEGER NOT NULL DEFAULT 30, -- seconds
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES auth.users(id),
  winning_hand JSONB,
  hand_history JSONB NOT NULL DEFAULT '[]'::jsonb -- Array of all actions
);

-- Create poker_actions table for tracking all player actions
CREATE TABLE public.poker_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.poker_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- fold, check, call, raise, all_in
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  game_state TEXT NOT NULL, -- preflop, flop, turn, river
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poker_hand_history table for completed hands
CREATE TABLE public.poker_hand_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.poker_games(id),
  table_id UUID NOT NULL REFERENCES public.poker_tables(id),
  winner_id UUID NOT NULL REFERENCES auth.users(id),
  winning_hand JSONB NOT NULL,
  pot_amount NUMERIC(10,2) NOT NULL,
  community_cards JSONB NOT NULL,
  players_data JSONB NOT NULL, -- All players' hole cards and final chip counts
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.poker_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poker_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poker_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poker_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poker_hand_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for poker_tables (everyone can view public tables)
CREATE POLICY "Anyone can view public poker tables" 
  ON public.poker_tables 
  FOR SELECT 
  USING (table_type = 'public' OR created_by = auth.uid());

CREATE POLICY "Users can create poker tables" 
  ON public.poker_tables 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Table creators can update their tables" 
  ON public.poker_tables 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- RLS policies for poker_players
CREATE POLICY "Players can view players at tables they're in or public tables" 
  ON public.poker_players 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.poker_players pp 
      WHERE pp.table_id = poker_players.table_id AND pp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.poker_tables pt 
      WHERE pt.id = poker_players.table_id AND pt.table_type = 'public'
    )
  );

CREATE POLICY "Users can join poker tables" 
  ON public.poker_players 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player status" 
  ON public.poker_players 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave poker tables" 
  ON public.poker_players 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for poker_games
CREATE POLICY "Players can view games at tables they're in" 
  ON public.poker_games 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.poker_players pp 
      WHERE pp.table_id = poker_games.table_id AND pp.user_id = auth.uid()
    )
  );

-- RLS policies for poker_actions
CREATE POLICY "Players can view actions for games they're in" 
  ON public.poker_actions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.poker_players pp 
      JOIN public.poker_games pg ON pp.table_id = pg.table_id
      WHERE pg.id = poker_actions.game_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert their own actions" 
  ON public.poker_actions 
  FOR INSERT 
  WITH CHECK (auth.uid() = player_id);

-- RLS policies for poker_hand_history
CREATE POLICY "Anyone can view poker hand history" 
  ON public.poker_hand_history 
  FOR SELECT 
  USING (true);

-- Function to join a poker table
CREATE OR REPLACE FUNCTION public.join_poker_table(
  p_table_id UUID,
  p_seat_number INTEGER,
  p_buy_in_amount NUMERIC(10,2)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table RECORD;
  v_wallet_balance NUMERIC(10,2);
BEGIN
  -- Get table details
  SELECT * INTO v_table
  FROM public.poker_tables
  WHERE id = p_table_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found';
  END IF;
  
  -- Check if table is full
  IF v_table.current_players >= v_table.max_players THEN
    RAISE EXCEPTION 'Table is full';
  END IF;
  
  -- Check if seat is available
  IF EXISTS (
    SELECT 1 FROM public.poker_players 
    WHERE table_id = p_table_id AND seat_number = p_seat_number
  ) THEN
    RAISE EXCEPTION 'Seat is occupied';
  END IF;
  
  -- Check if user is already at table
  IF EXISTS (
    SELECT 1 FROM public.poker_players 
    WHERE table_id = p_table_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already seated at this table';
  END IF;
  
  -- Validate buy-in amount
  IF p_buy_in_amount < v_table.buy_in_min OR p_buy_in_amount > v_table.buy_in_max THEN
    RAISE EXCEPTION 'Buy-in amount must be between % and %', v_table.buy_in_min, v_table.buy_in_max;
  END IF;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < p_buy_in_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct buy-in from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_buy_in_amount,
    'debit',
    'Poker table buy-in - Table: ' || v_table.name,
    'casino',
    p_table_id
  );
  
  -- Add player to table
  INSERT INTO public.poker_players (
    table_id, user_id, seat_number, chip_count
  ) VALUES (
    p_table_id, auth.uid(), p_seat_number, p_buy_in_amount
  );
  
  -- Update table player count
  UPDATE public.poker_tables
  SET current_players = current_players + 1,
      updated_at = NOW()
  WHERE id = p_table_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'seat_number', p_seat_number,
    'chip_count', p_buy_in_amount
  );
END;
$$;

-- Function to leave a poker table
CREATE OR REPLACE FUNCTION public.leave_poker_table(p_table_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player RECORD;
BEGIN
  -- Get player details
  SELECT * INTO v_player
  FROM public.poker_players
  WHERE table_id = p_table_id AND user_id = auth.uid()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not seated at this table';
  END IF;
  
  -- Credit remaining chips to wallet
  IF v_player.chip_count > 0 THEN
    PERFORM public.update_wallet_balance(
      auth.uid(),
      v_player.chip_count,
      'credit',
      'Poker table cash out - Seat: ' || v_player.seat_number,
      'casino',
      p_table_id
    );
  END IF;
  
  -- Remove player from table
  DELETE FROM public.poker_players
  WHERE table_id = p_table_id AND user_id = auth.uid();
  
  -- Update table player count
  UPDATE public.poker_tables
  SET current_players = current_players - 1,
      updated_at = NOW()
  WHERE id = p_table_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'chips_returned', v_player.chip_count
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_poker_tables_status ON public.poker_tables(status);
CREATE INDEX idx_poker_players_table_id ON public.poker_players(table_id);
CREATE INDEX idx_poker_players_user_id ON public.poker_players(user_id);
CREATE INDEX idx_poker_games_table_id ON public.poker_games(table_id);
CREATE INDEX idx_poker_actions_game_id ON public.poker_actions(game_id);
CREATE INDEX idx_poker_hand_history_table_id ON public.poker_hand_history(table_id);
CREATE INDEX idx_poker_hand_history_completed_at ON public.poker_hand_history(completed_at DESC);

-- Enable realtime for live updates
ALTER TABLE public.poker_tables REPLICA IDENTITY FULL;
ALTER TABLE public.poker_players REPLICA IDENTITY FULL;
ALTER TABLE public.poker_games REPLICA IDENTITY FULL;
ALTER TABLE public.poker_actions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.poker_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poker_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poker_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poker_actions;
