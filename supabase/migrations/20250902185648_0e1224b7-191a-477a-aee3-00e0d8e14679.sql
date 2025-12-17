-- Add chicken_run to game_type enum if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'chicken_run' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')
  ) THEN
    ALTER TYPE game_type ADD VALUE 'chicken_run';
  END IF;
END $$;

-- Create chicken_run_rounds table
CREATE TABLE IF NOT EXISTS public.chicken_run_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  trap_positions JSONB DEFAULT '[]'::JSONB,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'betting',
  bet_start_time TIMESTAMPTZ DEFAULT NOW(),
  bet_end_time TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chicken_run_bets table
CREATE TABLE IF NOT EXISTS public.chicken_run_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  round_id UUID REFERENCES public.chicken_run_rounds(id),
  bet_amount NUMERIC(10,2) NOT NULL,
  tiles_revealed JSONB DEFAULT '[]'::JSONB,
  current_row INTEGER DEFAULT 0,
  cashout_multiplier NUMERIC(10,2),
  payout_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chicken_run_leaderboard table
CREATE TABLE IF NOT EXISTS public.chicken_run_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  total_games INTEGER DEFAULT 0,
  total_won INTEGER DEFAULT 0,
  total_lost INTEGER DEFAULT 0,
  highest_multiplier NUMERIC(10,2) DEFAULT 0,
  total_winnings NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.chicken_run_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_run_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_run_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chicken_run_rounds
CREATE POLICY "Rounds are viewable by everyone" 
ON public.chicken_run_rounds FOR SELECT 
USING (true);

-- RLS Policies for chicken_run_bets
CREATE POLICY "Users can view their own bets" 
ON public.chicken_run_bets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" 
ON public.chicken_run_bets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets" 
ON public.chicken_run_bets FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for chicken_run_leaderboard
CREATE POLICY "Leaderboard is viewable by everyone" 
ON public.chicken_run_leaderboard FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own leaderboard entry" 
ON public.chicken_run_leaderboard FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry" 
ON public.chicken_run_leaderboard FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chicken_run_bets_user_id ON public.chicken_run_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_chicken_run_bets_round_id ON public.chicken_run_bets(round_id);
CREATE INDEX IF NOT EXISTS idx_chicken_run_bets_status ON public.chicken_run_bets(status);
CREATE INDEX IF NOT EXISTS idx_chicken_run_rounds_status ON public.chicken_run_rounds(status);
CREATE INDEX IF NOT EXISTS idx_chicken_run_leaderboard_highest_multiplier ON public.chicken_run_leaderboard(highest_multiplier DESC);

-- Update the existing place_chicken_run_bet function (already exists but needs fix)
CREATE OR REPLACE FUNCTION public.place_chicken_run_bet(p_bet_amount numeric, p_difficulty text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
  v_trap_positions JSONB;
BEGIN
  -- Validate bet amount
  IF p_bet_amount < 10 OR p_bet_amount > 10000 THEN
    RAISE EXCEPTION 'Bet amount must be between ₹10 and ₹10,000';
  END IF;

  -- Get active round or create new one
  SELECT * INTO v_round
  FROM public.chicken_run_rounds
  WHERE status = 'betting' AND bet_end_time > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Generate trap positions based on difficulty
    v_trap_positions := jsonb_build_array();
    
    INSERT INTO public.chicken_run_rounds (
      round_number,
      trap_positions,
      difficulty_level,
      status
    ) VALUES (
      COALESCE((SELECT MAX(round_number) FROM public.chicken_run_rounds), 0) + 1,
      v_trap_positions,
      p_difficulty,
      'betting'
    ) RETURNING * INTO v_round;
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();

  IF v_wallet_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Deduct from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Chicken Run bet - Round: ' || v_round.round_number,
    'chicken_run',
    v_round.id
  );

  -- Create bet
  INSERT INTO public.chicken_run_bets (
    user_id,
    round_id,
    bet_amount,
    difficulty,
    status
  ) VALUES (
    auth.uid(),
    v_round.id,
    p_bet_amount,
    p_difficulty,
    'active'
  ) RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'round_id', v_round.id,
    'round_number', v_round.round_number
  );
END;
$function$;

-- Update the existing reveal_chicken_run_tile function (already exists but needs fix)
CREATE OR REPLACE FUNCTION public.reveal_chicken_run_tile(p_bet_id uuid, p_row integer, p_column integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet RECORD;
  v_round RECORD;
  v_is_trap BOOLEAN;
  v_multiplier NUMERIC(10,2);
  v_base_multiplier NUMERIC(10,2);
  v_tiles_revealed JSONB;
  v_new_tile JSONB;
BEGIN
  -- Get bet details
  SELECT * INTO v_bet
  FROM public.chicken_run_bets
  WHERE id = p_bet_id AND user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or already completed';
  END IF;

  -- Check if correct row
  IF p_row != v_bet.current_row + 1 THEN
    RAISE EXCEPTION 'Invalid row selection';
  END IF;

  -- Get round details
  SELECT * INTO v_round
  FROM public.chicken_run_rounds
  WHERE id = v_bet.round_id;

  -- Determine if tile is a trap (random based on difficulty)
  CASE v_bet.difficulty
    WHEN 'easy' THEN 
      v_is_trap := random() < 0.2; -- 1 trap per 5 tiles (20%)
      v_base_multiplier := 1.2;
    WHEN 'medium' THEN 
      v_is_trap := random() < 0.4; -- 2 traps per 5 tiles (40%)
      v_base_multiplier := 1.5;
    WHEN 'hard' THEN 
      v_is_trap := random() < 0.6; -- 3 traps per 5 tiles (60%)
      v_base_multiplier := 2.5;
    ELSE 
      v_is_trap := random() < 0.4;
      v_base_multiplier := 1.5;
  END CASE;

  -- Create new tile record
  v_new_tile := jsonb_build_object(
    'row', p_row,
    'column', p_column,
    'is_trap', v_is_trap
  );

  -- Update tiles revealed
  v_tiles_revealed := v_bet.tiles_revealed || v_new_tile;

  IF v_is_trap THEN
    -- Game over - player lost
    UPDATE public.chicken_run_bets
    SET 
      status = 'lost',
      tiles_revealed = v_tiles_revealed,
      current_row = p_row,
      cashout_multiplier = 0,
      payout_amount = 0,
      updated_at = NOW()
    WHERE id = p_bet_id;

    -- Update leaderboard
    INSERT INTO public.chicken_run_leaderboard (user_id, total_games, total_lost)
    VALUES (auth.uid(), 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_games = chicken_run_leaderboard.total_games + 1,
      total_lost = chicken_run_leaderboard.total_lost + 1,
      updated_at = NOW();

    RETURN jsonb_build_object(
      'success', false,
      'is_trap', true,
      'game_over', true,
      'multiplier', 0,
      'message', 'Hit a trap! Game over.'
    );
  ELSE
    -- Safe tile - calculate new multiplier
    v_multiplier := power(v_base_multiplier, p_row);

    -- Update bet with new position
    UPDATE public.chicken_run_bets
    SET 
      tiles_revealed = v_tiles_revealed,
      current_row = p_row,
      cashout_multiplier = v_multiplier,
      updated_at = NOW()
    WHERE id = p_bet_id;

    RETURN jsonb_build_object(
      'success', true,
      'is_trap', false,
      'multiplier', v_multiplier,
      'potential_payout', v_bet.bet_amount * v_multiplier,
      'row', p_row
    );
  END IF;
END;
$function$;

-- Update the existing cashout_chicken_run_bet function (already exists but needs fix)
CREATE OR REPLACE FUNCTION public.cashout_chicken_run_bet(p_bet_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet RECORD;
  v_payout_amount NUMERIC(10,2);
BEGIN
  -- Get bet details
  SELECT * INTO v_bet
  FROM public.chicken_run_bets
  WHERE id = p_bet_id AND user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or already completed';
  END IF;

  IF v_bet.current_row = 0 THEN
    RAISE EXCEPTION 'Cannot cash out without revealing any tiles';
  END IF;

  -- Calculate payout
  v_payout_amount := v_bet.bet_amount * COALESCE(v_bet.cashout_multiplier, 1);

  -- Update bet status
  UPDATE public.chicken_run_bets
  SET 
    status = 'won',
    payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_bet_id;

  -- Credit wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    v_payout_amount,
    'credit',
    'Chicken Run cashout - Multiplier: ' || v_bet.cashout_multiplier || 'x',
    'chicken_run',
    v_bet.round_id
  );

  -- Update leaderboard
  INSERT INTO public.chicken_run_leaderboard (
    user_id, 
    total_games, 
    total_won, 
    highest_multiplier,
    total_winnings
  )
  VALUES (
    auth.uid(), 
    1, 
    1, 
    v_bet.cashout_multiplier,
    v_payout_amount - v_bet.bet_amount
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = chicken_run_leaderboard.total_games + 1,
    total_won = chicken_run_leaderboard.total_won + 1,
    highest_multiplier = GREATEST(chicken_run_leaderboard.highest_multiplier, v_bet.cashout_multiplier),
    total_winnings = chicken_run_leaderboard.total_winnings + (v_payout_amount - v_bet.bet_amount),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'payout_amount', v_payout_amount,
    'multiplier', v_bet.cashout_multiplier
  );
END;
$function$;