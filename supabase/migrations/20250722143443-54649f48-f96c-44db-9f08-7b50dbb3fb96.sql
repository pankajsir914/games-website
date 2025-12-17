
-- Create rummy game sessions table
CREATE TABLE public.rummy_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('points', 'pool', 'deals')),
  entry_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_players INTEGER NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 6),
  current_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  players JSONB NOT NULL DEFAULT '{"user_ids": [], "user_data": []}',
  game_state JSONB DEFAULT NULL,
  prize_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  winner_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rummy game moves table for tracking game history
CREATE TABLE public.rummy_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.rummy_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  move_type TEXT NOT NULL CHECK (move_type IN ('pick_from_deck', 'pick_from_discard', 'discard', 'declare', 'drop')),
  card_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rummy_sessions
ALTER TABLE public.rummy_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for rummy_sessions
CREATE POLICY "Users can view all rummy sessions" ON public.rummy_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can create rummy sessions" ON public.rummy_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sessions they created or joined" ON public.rummy_sessions
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid()::text = ANY(SELECT jsonb_array_elements_text(players->'user_ids'))
  );

-- Enable RLS on rummy_moves
ALTER TABLE public.rummy_moves ENABLE ROW LEVEL SECURITY;

-- RLS policies for rummy_moves
CREATE POLICY "Users can view moves for sessions they're in" ON public.rummy_moves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rummy_sessions rs 
      WHERE rs.id = session_id 
      AND (rs.created_by = auth.uid() OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(rs.players->'user_ids')))
    )
  );

CREATE POLICY "Users can insert moves for sessions they're in" ON public.rummy_moves
  FOR INSERT WITH CHECK (
    auth.uid() = player_id AND
    EXISTS (
      SELECT 1 FROM public.rummy_sessions rs 
      WHERE rs.id = session_id 
      AND auth.uid()::text = ANY(SELECT jsonb_array_elements_text(rs.players->'user_ids'))
    )
  );

-- Function to join rummy session
CREATE OR REPLACE FUNCTION public.join_rummy_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_user_data JSONB;
  v_new_players JSONB;
  v_wallet_balance DECIMAL(10,2);
BEGIN
  -- Get session details
  SELECT * INTO v_session
  FROM public.rummy_sessions
  WHERE id = p_session_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  IF v_session.status != 'waiting' THEN
    RAISE EXCEPTION 'Session is not accepting new players';
  END IF;
  
  IF v_session.current_players >= v_session.max_players THEN
    RAISE EXCEPTION 'Session is full';
  END IF;
  
  -- Check if user is already in the session
  IF auth.uid()::text = ANY(SELECT jsonb_array_elements_text(v_session.players->'user_ids')) THEN
    RAISE EXCEPTION 'User already in session';
  END IF;
  
  -- Check user wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < v_session.entry_fee THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct entry fee from wallet
  IF v_session.entry_fee > 0 THEN
    PERFORM public.update_wallet_balance(
      auth.uid(),
      v_session.entry_fee,
      'debit',
      'Joined Rummy session - ID: ' || p_session_id::text,
      'rummy',
      p_session_id
    );
  END IF;
  
  -- Get user data
  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.full_name
  ) INTO v_user_data
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Update session with new player
  v_new_players := jsonb_build_object(
    'user_ids', (v_session.players->'user_ids') || jsonb_build_array(auth.uid()),
    'user_data', (v_session.players->'user_data') || jsonb_build_array(v_user_data)
  );
  
  UPDATE public.rummy_sessions
  SET players = v_new_players,
      current_players = current_players + 1,
      prize_pool = prize_pool + v_session.entry_fee
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'entry_fee', v_session.entry_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start rummy game
CREATE OR REPLACE FUNCTION public.start_rummy_game(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Get session details
  SELECT * INTO v_session
  FROM public.rummy_sessions
  WHERE id = p_session_id
  AND created_by = auth.uid()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not authorized';
  END IF;
  
  IF v_session.status != 'waiting' THEN
    RAISE EXCEPTION 'Session cannot be started';
  END IF;
  
  IF v_session.current_players < 2 THEN
    RAISE EXCEPTION 'Need at least 2 players to start';
  END IF;
  
  -- Update session status
  UPDATE public.rummy_sessions
  SET status = 'active',
      started_at = NOW()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'players', v_session.current_players
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
