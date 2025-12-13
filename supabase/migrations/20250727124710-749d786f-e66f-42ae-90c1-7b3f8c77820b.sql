-- Create Ludo game tables with proper security

-- Ludo rooms table
CREATE TABLE public.ludo_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  max_players INTEGER NOT NULL CHECK (max_players IN (2, 4)),
  entry_fee NUMERIC(10,2) NOT NULL CHECK (entry_fee >= 1.00 AND entry_fee <= 500.00),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  current_players INTEGER NOT NULL DEFAULT 0,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_state JSONB DEFAULT NULL,
  winner_id UUID DEFAULT NULL,
  total_pot NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC(10,2) DEFAULT 0.00,
  winner_amount NUMERIC(10,2) DEFAULT 0.00,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ludo moves table
CREATE TABLE public.ludo_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.ludo_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  move_type TEXT NOT NULL CHECK (move_type IN ('roll_dice', 'move_token', 'pass_turn', 'forfeit')),
  dice_value INTEGER CHECK (dice_value >= 1 AND dice_value <= 6),
  token_id TEXT DEFAULT NULL,
  from_position INTEGER DEFAULT NULL,
  to_position INTEGER DEFAULT NULL,
  killed_token_id TEXT DEFAULT NULL,
  move_data JSONB DEFAULT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ludo player sessions for real-time tracking
CREATE TABLE public.ludo_player_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.ludo_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  player_position INTEGER NOT NULL CHECK (player_position >= 1 AND player_position <= 4),
  player_color TEXT NOT NULL CHECK (player_color IN ('red', 'blue', 'yellow', 'green')),
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  turn_timeout_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, player_position),
  UNIQUE(room_id, player_color)
);

-- Enable Row Level Security
ALTER TABLE public.ludo_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_player_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_rooms
CREATE POLICY "Users can view all ludo rooms" 
ON public.ludo_rooms FOR SELECT 
USING (true);

CREATE POLICY "Users can create ludo rooms" 
ON public.ludo_rooms FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators and players can update rooms" 
ON public.ludo_rooms FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid()::text IN (
    SELECT jsonb_array_elements_text(players->'user_ids')
  )
);

-- RLS Policies for ludo_moves
CREATE POLICY "Players can view moves for their rooms" 
ON public.ludo_moves FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ludo_player_sessions lps 
    WHERE lps.room_id = ludo_moves.room_id 
    AND lps.player_id = auth.uid()
  )
);

CREATE POLICY "Players can create moves for their rooms" 
ON public.ludo_moves FOR INSERT 
WITH CHECK (
  auth.uid() = player_id AND
  EXISTS (
    SELECT 1 FROM public.ludo_player_sessions lps 
    WHERE lps.room_id = ludo_moves.room_id 
    AND lps.player_id = auth.uid()
  )
);

-- RLS Policies for ludo_player_sessions
CREATE POLICY "Players can view sessions for their rooms" 
ON public.ludo_player_sessions FOR SELECT 
USING (
  player_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.ludo_player_sessions lps 
    WHERE lps.room_id = ludo_player_sessions.room_id 
    AND lps.player_id = auth.uid()
  )
);

CREATE POLICY "Players can create their own sessions" 
ON public.ludo_player_sessions FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own sessions" 
ON public.ludo_player_sessions FOR UPDATE 
USING (auth.uid() = player_id);

-- Create indexes for performance
CREATE INDEX idx_ludo_rooms_status ON public.ludo_rooms(status);
CREATE INDEX idx_ludo_rooms_created_by ON public.ludo_rooms(created_by);
CREATE INDEX idx_ludo_moves_room_id ON public.ludo_moves(room_id);
CREATE INDEX idx_ludo_moves_player_id ON public.ludo_moves(player_id);
CREATE INDEX idx_ludo_player_sessions_room_id ON public.ludo_player_sessions(room_id);
CREATE INDEX idx_ludo_player_sessions_player_id ON public.ludo_player_sessions(player_id);

-- Function to create a ludo room
CREATE OR REPLACE FUNCTION public.create_ludo_room(
  p_max_players INTEGER,
  p_entry_fee NUMERIC
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_room_id UUID;
  v_wallet_balance NUMERIC(10,2);
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate parameters
  IF p_max_players NOT IN (2, 4) THEN
    RAISE EXCEPTION 'Max players must be 2 or 4';
  END IF;

  IF p_entry_fee < 10.00 OR p_entry_fee > 1000.00 THEN
    RAISE EXCEPTION 'Entry fee must be between ₹10.00 and ₹1000.00';
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < p_entry_fee THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Create room
  INSERT INTO public.ludo_rooms (
    created_by, max_players, entry_fee, current_players, total_pot
  ) VALUES (
    v_user_id, p_max_players, p_entry_fee, 1, p_entry_fee
  ) RETURNING id INTO v_room_id;

  -- Deduct entry fee from wallet
  PERFORM public.update_wallet_balance(
    v_user_id,
    p_entry_fee,
    'debit',
    'Ludo room entry fee - Room ID: ' || v_room_id::text,
    'ludo',
    v_room_id
  );

  -- Add creator as first player
  INSERT INTO public.ludo_player_sessions (
    room_id, player_id, player_position, player_color
  ) VALUES (
    v_room_id, v_user_id, 1, 'red'
  );

  -- Update room with first player
  UPDATE public.ludo_rooms
  SET players = jsonb_build_object(
    'user_ids', jsonb_build_array(v_user_id),
    'positions', jsonb_build_object('1', v_user_id),
    'colors', jsonb_build_object('red', v_user_id)
  )
  WHERE id = v_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room_id,
    'entry_fee', p_entry_fee
  );
END;
$function$;

-- Function to join a ludo room
CREATE OR REPLACE FUNCTION public.join_ludo_room(
  p_room_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_room RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_user_id UUID := auth.uid();
  v_player_position INTEGER;
  v_player_color TEXT;
  v_colors TEXT[] := ARRAY['blue', 'yellow', 'green'];
  v_updated_players JSONB;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get room details
  SELECT * INTO v_room
  FROM public.ludo_rooms
  WHERE id = p_room_id AND status = 'waiting'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found or not accepting players';
  END IF;

  -- Check if room is full
  IF v_room.current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Check if user is already in the room
  IF EXISTS (
    SELECT 1 FROM public.ludo_player_sessions 
    WHERE room_id = p_room_id AND player_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Already joined this room';
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < v_room.entry_fee THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Determine player position and color
  v_player_position := v_room.current_players + 1;
  v_player_color := v_colors[v_player_position - 1];

  -- Deduct entry fee from wallet
  PERFORM public.update_wallet_balance(
    v_user_id,
    v_room.entry_fee,
    'debit',
    'Ludo room entry fee - Room ID: ' || p_room_id::text,
    'ludo',
    p_room_id
  );

  -- Add player session
  INSERT INTO public.ludo_player_sessions (
    room_id, player_id, player_position, player_color
  ) VALUES (
    p_room_id, v_user_id, v_player_position, v_player_color
  );

  -- Update room
  v_updated_players := jsonb_build_object(
    'user_ids', (v_room.players->'user_ids') || jsonb_build_array(v_user_id),
    'positions', (v_room.players->'positions') || jsonb_build_object(v_player_position::text, v_user_id),
    'colors', (v_room.players->'colors') || jsonb_build_object(v_player_color, v_user_id)
  );

  UPDATE public.ludo_rooms
  SET 
    current_players = current_players + 1,
    total_pot = total_pot + v_room.entry_fee,
    players = v_updated_players,
    status = CASE 
      WHEN current_players + 1 >= max_players THEN 'active'
      ELSE 'waiting'
    END,
    started_at = CASE 
      WHEN current_players + 1 >= max_players THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'player_position', v_player_position,
    'player_color', v_player_color,
    'room_full', v_room.current_players + 1 >= v_room.max_players
  );
END;
$function$;

-- Function to complete a ludo game
CREATE OR REPLACE FUNCTION public.complete_ludo_game(
  p_room_id UUID,
  p_winner_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_room RECORD;
  v_commission_amount NUMERIC(10,2);
  v_winner_amount NUMERIC(10,2);
BEGIN
  -- Get room details
  SELECT * INTO v_room
  FROM public.ludo_rooms
  WHERE id = p_room_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found or not active';
  END IF;

  -- Verify winner is in the room
  IF NOT EXISTS (
    SELECT 1 FROM public.ludo_player_sessions 
    WHERE room_id = p_room_id AND player_id = p_winner_id
  ) THEN
    RAISE EXCEPTION 'Winner not found in room';
  END IF;

  -- Calculate amounts
  v_commission_amount := v_room.total_pot * v_room.commission_rate;
  v_winner_amount := v_room.total_pot - v_commission_amount;

  -- Update room
  UPDATE public.ludo_rooms
  SET 
    status = 'completed',
    winner_id = p_winner_id,
    commission_amount = v_commission_amount,
    winner_amount = v_winner_amount,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_room_id;

  -- Credit winner's wallet
  PERFORM public.update_wallet_balance(
    p_winner_id,
    v_winner_amount,
    'credit',
    'Ludo game win - Room ID: ' || p_room_id::text,
    'ludo',
    p_room_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'winner_amount', v_winner_amount,
    'commission_amount', v_commission_amount,
    'total_pot', v_room.total_pot
  );
END;
$function$;

-- Enable realtime for all ludo tables
ALTER TABLE public.ludo_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.ludo_moves REPLICA IDENTITY FULL;
ALTER TABLE public.ludo_player_sessions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_player_sessions;
