
-- Create Roulette game rounds table
CREATE TABLE public.roulette_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  winning_number INTEGER CHECK (winning_number >= 0 AND winning_number <= 36),
  winning_color TEXT CHECK (winning_color IN ('red', 'black', 'green')),
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'spinning', 'completed')),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  spin_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Roulette bets table
CREATE TABLE public.roulette_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  round_id UUID NOT NULL REFERENCES public.roulette_rounds(id),
  bet_type TEXT NOT NULL CHECK (bet_type IN (
    'straight', 'red', 'black', 'even', 'odd', 'low', 'high',
    'dozen_1', 'dozen_2', 'dozen_3', 'column_1', 'column_2', 'column_3'
  )),
  bet_value TEXT, -- For straight bets, this will be the number
  bet_amount NUMERIC(10,2) NOT NULL CHECK (bet_amount > 0),
  payout_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.roulette_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for rounds (everyone can view)
CREATE POLICY "Anyone can view roulette rounds" ON public.roulette_rounds
  FOR SELECT USING (true);

-- RLS policies for bets
CREATE POLICY "Users can view their own roulette bets" ON public.roulette_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roulette bets" ON public.roulette_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to place a roulette bet
CREATE OR REPLACE FUNCTION public.place_roulette_bet(
  p_round_id UUID,
  p_bet_type TEXT,
  p_bet_value TEXT,
  p_bet_amount NUMERIC
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
BEGIN
  -- Get round details
  SELECT * INTO v_round
  FROM public.roulette_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Validate bet type
  IF p_bet_type NOT IN ('straight', 'red', 'black', 'even', 'odd', 'low', 'high',
                        'dozen_1', 'dozen_2', 'dozen_3', 'column_1', 'column_2', 'column_3') THEN
    RAISE EXCEPTION 'Invalid bet type';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 1 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹1';
  END IF;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct bet amount from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Roulette bet - Round: ' || v_round.round_number,
    'casino',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.roulette_bets (
    user_id, round_id, bet_type, bet_value, bet_amount
  ) VALUES (
    auth.uid(), p_round_id, p_bet_type, p_bet_value, p_bet_amount
  ) RETURNING id INTO v_bet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'bet_type', p_bet_type
  );
END;
$function$;

-- Function to process roulette round results
CREATE OR REPLACE FUNCTION public.process_roulette_round(
  p_round_id UUID,
  p_winning_number INTEGER
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_bet RECORD;
  v_winning_color TEXT;
  v_payout_amount NUMERIC(10,2);
  v_total_payouts NUMERIC(10,2) := 0;
  v_total_bets INTEGER := 0;
  v_winning_bets INTEGER := 0;
  v_is_winner BOOLEAN;
  v_payout_multiplier NUMERIC;
BEGIN
  -- Determine winning color
  IF p_winning_number = 0 THEN
    v_winning_color := 'green';
  ELSIF p_winning_number IN (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) THEN
    v_winning_color := 'red';
  ELSE
    v_winning_color := 'black';
  END IF;
  
  -- Update round status
  UPDATE public.roulette_rounds
  SET 
    status = 'completed',
    winning_number = p_winning_number,
    winning_color = v_winning_color,
    spin_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Process all bets for this round
  FOR v_bet IN 
    SELECT * FROM public.roulette_bets 
    WHERE round_id = p_round_id AND status = 'pending'
  LOOP
    v_total_bets := v_total_bets + 1;
    v_is_winner := false;
    v_payout_multiplier := 0;
    
    -- Check if bet wins based on type
    CASE v_bet.bet_type
      WHEN 'straight' THEN
        IF v_bet.bet_value::INTEGER = p_winning_number THEN
          v_is_winner := true;
          v_payout_multiplier := 35;
        END IF;
      WHEN 'red' THEN
        IF v_winning_color = 'red' THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'black' THEN
        IF v_winning_color = 'black' THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'even' THEN
        IF p_winning_number > 0 AND p_winning_number % 2 = 0 THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'odd' THEN
        IF p_winning_number > 0 AND p_winning_number % 2 = 1 THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'low' THEN
        IF p_winning_number >= 1 AND p_winning_number <= 18 THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'high' THEN
        IF p_winning_number >= 19 AND p_winning_number <= 36 THEN
          v_is_winner := true;
          v_payout_multiplier := 1;
        END IF;
      WHEN 'dozen_1' THEN
        IF p_winning_number >= 1 AND p_winning_number <= 12 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
      WHEN 'dozen_2' THEN
        IF p_winning_number >= 13 AND p_winning_number <= 24 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
      WHEN 'dozen_3' THEN
        IF p_winning_number >= 25 AND p_winning_number <= 36 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_1' THEN
        IF p_winning_number > 0 AND p_winning_number % 3 = 1 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_2' THEN
        IF p_winning_number > 0 AND p_winning_number % 3 = 2 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
      WHEN 'column_3' THEN
        IF p_winning_number > 0 AND p_winning_number % 3 = 0 THEN
          v_is_winner := true;
          v_payout_multiplier := 2;
        END IF;
    END CASE;
    
    IF v_is_winner THEN
      -- Calculate payout (bet amount + winnings)
      v_payout_amount := v_bet.bet_amount * (v_payout_multiplier + 1);
      v_total_payouts := v_total_payouts + v_payout_amount;
      v_winning_bets := v_winning_bets + 1;
      
      -- Update bet status
      UPDATE public.roulette_bets
      SET 
        status = 'won',
        payout_amount = v_payout_amount,
        updated_at = NOW()
      WHERE id = v_bet.id;
      
      -- Credit wallet with payout
      PERFORM public.update_wallet_balance(
        v_bet.user_id,
        v_payout_amount,
        'credit',
        'Roulette win - Round: ' || (SELECT round_number FROM public.roulette_rounds WHERE id = p_round_id),
        'casino',
        p_round_id
      );
    ELSE
      -- Losing bet
      UPDATE public.roulette_bets
      SET 
        status = 'lost',
        payout_amount = 0,
        updated_at = NOW()
      WHERE id = v_bet.id;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'round_id', p_round_id,
    'winning_number', p_winning_number,
    'winning_color', v_winning_color,
    'total_bets', v_total_bets,
    'winning_bets', v_winning_bets,
    'total_payouts', v_total_payouts
  );
END;
$function$;

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.roulette_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roulette_bets;

-- Set replica identity for realtime updates
ALTER TABLE public.roulette_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.roulette_bets REPLICA IDENTITY FULL;

-- Create indexes for performance
CREATE INDEX idx_roulette_rounds_status ON public.roulette_rounds(status);
CREATE INDEX idx_roulette_rounds_created_at ON public.roulette_rounds(created_at DESC);
CREATE INDEX idx_roulette_bets_user_round ON public.roulette_bets(user_id, round_id);
CREATE INDEX idx_roulette_bets_round_status ON public.roulette_bets(round_id, status);
