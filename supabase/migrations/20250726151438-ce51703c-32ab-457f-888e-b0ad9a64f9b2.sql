-- Create jackpot rounds table
CREATE TABLE public.jackpot_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_players INTEGER NOT NULL DEFAULT 0,
  winner_id UUID NULL,
  winner_amount NUMERIC(10,2) NULL,
  commission_amount NUMERIC(10,2) NULL DEFAULT 0.00,
  commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.05,
  seed_hash TEXT NULL,
  result_hash TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jackpot entries table
CREATE TABLE public.jackpot_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.jackpot_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 1.00),
  win_probability NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  ticket_start INTEGER NOT NULL,
  ticket_end INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_jackpot_rounds_status ON public.jackpot_rounds(status);
CREATE INDEX idx_jackpot_rounds_start_time ON public.jackpot_rounds(start_time);
CREATE INDEX idx_jackpot_entries_round_id ON public.jackpot_entries(round_id);
CREATE INDEX idx_jackpot_entries_user_id ON public.jackpot_entries(user_id);

-- Enable RLS
ALTER TABLE public.jackpot_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jackpot_rounds
CREATE POLICY "Anyone can view jackpot rounds" 
ON public.jackpot_rounds 
FOR SELECT 
USING (true);

-- RLS Policies for jackpot_entries
CREATE POLICY "Users can view all jackpot entries" 
ON public.jackpot_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own jackpot entries" 
ON public.jackpot_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to join jackpot round
CREATE OR REPLACE FUNCTION public.join_jackpot_round(p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_entry_id UUID;
  v_ticket_start INTEGER;
  v_ticket_end INTEGER;
  v_new_probability NUMERIC(5,4);
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate amount
  IF p_amount < 1.00 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹1.00';
  END IF;

  -- Get active round
  SELECT * INTO v_round
  FROM public.jackpot_rounds
  WHERE status = 'active' AND end_time > NOW()
  ORDER BY start_time DESC
  LIMIT 1
  FOR UPDATE;
  
  -- Create new round if none exists
  IF NOT FOUND THEN
    INSERT INTO public.jackpot_rounds (end_time)
    VALUES (NOW() + INTERVAL '60 seconds')
    RETURNING * INTO v_round;
  END IF;

  -- Check if user already has entry in this round
  IF EXISTS (
    SELECT 1 FROM public.jackpot_entries 
    WHERE round_id = v_round.id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User already has an entry in the current round';
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Deduct from wallet
  PERFORM public.update_wallet_balance(
    v_user_id,
    p_amount,
    'debit',
    'Jackpot round entry - Round: ' || v_round.id,
    'casino',
    v_round.id
  );

  -- Calculate ticket range
  v_ticket_start := v_round.total_amount * 100 + 1; -- Convert to cents for precision
  v_ticket_end := v_ticket_start + (p_amount * 100) - 1;

  -- Insert entry
  INSERT INTO public.jackpot_entries (
    round_id, user_id, amount, ticket_start, ticket_end
  ) VALUES (
    v_round.id, v_user_id, p_amount, v_ticket_start, v_ticket_end
  ) RETURNING id INTO v_entry_id;

  -- Update round totals
  UPDATE public.jackpot_rounds
  SET 
    total_amount = total_amount + p_amount,
    total_players = total_players + 1,
    updated_at = NOW()
  WHERE id = v_round.id;

  -- Calculate win probability
  v_new_probability := p_amount / (v_round.total_amount + p_amount);
  
  UPDATE public.jackpot_entries
  SET win_probability = v_new_probability
  WHERE id = v_entry_id;

  -- Update all probabilities for this round
  UPDATE public.jackpot_entries 
  SET win_probability = amount / (v_round.total_amount + p_amount)
  WHERE round_id = v_round.id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'round_id', v_round.id,
    'amount', p_amount,
    'win_probability', v_new_probability,
    'total_pot', v_round.total_amount + p_amount
  );
END;
$$;

-- Function to complete jackpot round
CREATE OR REPLACE FUNCTION public.complete_jackpot_round(p_round_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_winning_ticket INTEGER;
  v_winner RECORD;
  v_commission NUMERIC(10,2);
  v_winner_amount NUMERIC(10,2);
  v_random_seed TEXT;
BEGIN
  -- Get round details
  SELECT * INTO v_round
  FROM public.jackpot_rounds
  WHERE id = p_round_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or already completed';
  END IF;

  IF v_round.total_amount = 0 THEN
    -- Cancel round if no entries
    UPDATE public.jackpot_rounds
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_round_id;
    
    RETURN jsonb_build_object('success', true, 'status', 'cancelled');
  END IF;

  -- Generate provably fair random number
  v_random_seed := encode(gen_random_bytes(32), 'hex');
  v_winning_ticket := (abs(hashtext(v_random_seed)) % (v_round.total_amount * 100)::INTEGER) + 1;

  -- Find winner
  SELECT e.*, p.full_name INTO v_winner
  FROM public.jackpot_entries e
  LEFT JOIN public.profiles p ON p.id = e.user_id
  WHERE e.round_id = p_round_id 
  AND v_winning_ticket BETWEEN e.ticket_start AND e.ticket_end;

  -- Calculate amounts
  v_commission := v_round.total_amount * v_round.commission_rate;
  v_winner_amount := v_round.total_amount - v_commission;

  -- Update round
  UPDATE public.jackpot_rounds
  SET 
    status = 'completed',
    winner_id = v_winner.user_id,
    winner_amount = v_winner_amount,
    commission_amount = v_commission,
    seed_hash = v_random_seed,
    result_hash = encode(sha256(v_random_seed::bytea), 'hex'),
    updated_at = NOW()
  WHERE id = p_round_id;

  -- Credit winner
  IF v_winner.user_id IS NOT NULL THEN
    PERFORM public.update_wallet_balance(
      v_winner.user_id,
      v_winner_amount,
      'credit',
      'Jackpot win - Round: ' || p_round_id,
      'casino',
      p_round_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner.user_id,
    'winner_name', COALESCE(v_winner.full_name, 'Anonymous'),
    'winner_amount', v_winner_amount,
    'total_pot', v_round.total_amount,
    'commission', v_commission,
    'winning_ticket', v_winning_ticket
  );
END;
$$;

-- Function to get current round info
CREATE OR REPLACE FUNCTION public.get_current_jackpot_round()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_entries JSONB;
  v_user_entry RECORD;
BEGIN
  -- Get active round
  SELECT * INTO v_round
  FROM public.jackpot_rounds
  WHERE status = 'active' AND end_time > NOW()
  ORDER BY start_time DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'active', false,
      'message', 'No active round'
    );
  END IF;

  -- Get entries with user info
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', e.user_id,
      'amount', e.amount,
      'win_probability', e.win_probability,
      'user_name', COALESCE(p.full_name, 'Anonymous')
    )
  ) INTO v_entries
  FROM public.jackpot_entries e
  LEFT JOIN public.profiles p ON p.id = e.user_id
  WHERE e.round_id = v_round.id;

  -- Get current user's entry if authenticated
  IF auth.uid() IS NOT NULL THEN
    SELECT * INTO v_user_entry
    FROM public.jackpot_entries
    WHERE round_id = v_round.id AND user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'active', true,
    'round_id', v_round.id,
    'total_amount', v_round.total_amount,
    'total_players', v_round.total_players,
    'end_time', v_round.end_time,
    'time_remaining', EXTRACT(EPOCH FROM (v_round.end_time - NOW())),
    'entries', COALESCE(v_entries, '[]'::jsonb),
    'user_entry', CASE 
      WHEN v_user_entry IS NOT NULL THEN 
        jsonb_build_object(
          'amount', v_user_entry.amount,
          'win_probability', v_user_entry.win_probability
        )
      ELSE NULL 
    END
  );
END;
$$;

-- Add realtime for jackpot tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_entries;

-- Set replica identity for real-time updates
ALTER TABLE public.jackpot_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.jackpot_entries REPLICA IDENTITY FULL;