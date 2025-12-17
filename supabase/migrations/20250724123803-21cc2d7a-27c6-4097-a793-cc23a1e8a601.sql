
-- Create jackpot_games table to store game rounds
CREATE TABLE public.jackpot_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'low', -- low, medium, high
  ticket_price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  max_tickets_per_user INTEGER NOT NULL DEFAULT 100,
  total_pool NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  winner_id UUID REFERENCES auth.users(id),
  winning_ticket_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create jackpot_tickets table to store user ticket purchases
CREATE TABLE public.jackpot_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.jackpot_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ticket_numbers INTEGER[] NOT NULL, -- Array of ticket numbers purchased
  ticket_count INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jackpot_winners table for winner history
CREATE TABLE public.jackpot_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.jackpot_games(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  prize_amount NUMERIC(10,2) NOT NULL,
  winning_ticket_number INTEGER NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.jackpot_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_winners ENABLE ROW LEVEL SECURITY;

-- RLS policies for jackpot_games (everyone can view active games)
CREATE POLICY "Anyone can view jackpot games" 
  ON public.jackpot_games 
  FOR SELECT 
  USING (true);

-- RLS policies for jackpot_tickets
CREATE POLICY "Users can view their own tickets" 
  ON public.jackpot_tickets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets" 
  ON public.jackpot_tickets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for jackpot_winners (everyone can view winners)
CREATE POLICY "Anyone can view jackpot winners" 
  ON public.jackpot_winners 
  FOR SELECT 
  USING (true);

-- Function to buy jackpot tickets
CREATE OR REPLACE FUNCTION public.buy_jackpot_tickets(
  p_game_id UUID,
  p_ticket_count INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game RECORD;
  v_user_tickets INTEGER;
  v_ticket_price NUMERIC(10,2);
  v_total_cost NUMERIC(10,2);
  v_starting_ticket INTEGER;
  v_ticket_numbers INTEGER[];
  v_wallet_balance NUMERIC(10,2);
  i INTEGER;
BEGIN
  -- Get game details
  SELECT * INTO v_game
  FROM public.jackpot_games
  WHERE id = p_game_id AND status = 'active' AND ends_at > NOW()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found or not active';
  END IF;
  
  -- Check if user already has tickets for this game
  SELECT COALESCE(SUM(ticket_count), 0) INTO v_user_tickets
  FROM public.jackpot_tickets
  WHERE game_id = p_game_id AND user_id = auth.uid();
  
  -- Check max tickets per user limit
  IF v_user_tickets + p_ticket_count > v_game.max_tickets_per_user THEN
    RAISE EXCEPTION 'Exceeds maximum tickets per user limit';
  END IF;
  
  -- Calculate cost
  v_total_cost := v_game.ticket_price * p_ticket_count;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    v_total_cost,
    'debit',
    'Jackpot tickets purchased - Game ID: ' || p_game_id::text,
    'casino',
    p_game_id
  );
  
  -- Generate ticket numbers (sequential)
  v_starting_ticket := v_game.total_tickets + 1;
  v_ticket_numbers := ARRAY[]::INTEGER[];
  
  FOR i IN v_starting_ticket..(v_starting_ticket + p_ticket_count - 1) LOOP
    v_ticket_numbers := array_append(v_ticket_numbers, i);
  END LOOP;
  
  -- Insert ticket purchase
  INSERT INTO public.jackpot_tickets (
    game_id, user_id, ticket_numbers, ticket_count, amount_paid
  ) VALUES (
    p_game_id, auth.uid(), v_ticket_numbers, p_ticket_count, v_total_cost
  );
  
  -- Update game totals
  UPDATE public.jackpot_games
  SET 
    total_pool = total_pool + v_total_cost,
    total_tickets = total_tickets + p_ticket_count,
    total_participants = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.jackpot_tickets
      WHERE game_id = p_game_id
    )
  WHERE id = p_game_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket_numbers', v_ticket_numbers,
    'amount_paid', v_total_cost
  );
END;
$$;

-- Function to complete jackpot game and select winner
CREATE OR REPLACE FUNCTION public.complete_jackpot_game(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game RECORD;
  v_winning_ticket INTEGER;
  v_winner_record RECORD;
  v_prize_amount NUMERIC(10,2);
BEGIN
  -- Get game details
  SELECT * INTO v_game
  FROM public.jackpot_games
  WHERE id = p_game_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found or not active';
  END IF;
  
  IF v_game.total_tickets = 0 THEN
    -- No tickets sold, mark as cancelled
    UPDATE public.jackpot_games
    SET status = 'cancelled', completed_at = NOW()
    WHERE id = p_game_id;
    
    RETURN jsonb_build_object('success', true, 'status', 'cancelled');
  END IF;
  
  -- Generate random winning ticket number
  v_winning_ticket := floor(random() * v_game.total_tickets) + 1;
  
  -- Find the winner
  SELECT jt.user_id, p.full_name INTO v_winner_record
  FROM public.jackpot_tickets jt
  JOIN public.profiles p ON p.id = jt.user_id
  WHERE jt.game_id = p_game_id 
  AND v_winning_ticket = ANY(jt.ticket_numbers);
  
  -- Calculate prize (90% of pool, 10% goes to house)
  v_prize_amount := v_game.total_pool * 0.9;
  
  -- Update game with winner
  UPDATE public.jackpot_games
  SET 
    status = 'completed',
    winner_id = v_winner_record.user_id,
    winning_ticket_number = v_winning_ticket,
    completed_at = NOW()
  WHERE id = p_game_id;
  
  -- Add to winner history
  INSERT INTO public.jackpot_winners (
    game_id, user_id, prize_amount, winning_ticket_number, tier
  ) VALUES (
    p_game_id, v_winner_record.user_id, v_prize_amount, v_winning_ticket, v_game.tier
  );
  
  -- Credit winner's wallet
  PERFORM public.update_wallet_balance(
    v_winner_record.user_id,
    v_prize_amount,
    'credit',
    'Jackpot prize won - Game ID: ' || p_game_id::text,
    'casino',
    p_game_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_record.user_id,
    'winner_name', v_winner_record.full_name,
    'winning_ticket', v_winning_ticket,
    'prize_amount', v_prize_amount
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_jackpot_games_status_ends_at ON public.jackpot_games(status, ends_at);
CREATE INDEX idx_jackpot_tickets_game_user ON public.jackpot_tickets(game_id, user_id);
CREATE INDEX idx_jackpot_tickets_game_numbers ON public.jackpot_tickets USING GIN(ticket_numbers);
CREATE INDEX idx_jackpot_winners_created_at ON public.jackpot_winners(created_at DESC);

-- Enable realtime for live updates
ALTER TABLE public.jackpot_games REPLICA IDENTITY FULL;
ALTER TABLE public.jackpot_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.jackpot_winners REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_winners;
