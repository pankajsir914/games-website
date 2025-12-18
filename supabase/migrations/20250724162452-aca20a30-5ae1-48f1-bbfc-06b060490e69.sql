
-- Create color prediction rounds table
CREATE TABLE public.color_prediction_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'drawing', 'completed')),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  draw_time TIMESTAMP WITH TIME ZONE,
  winning_color TEXT CHECK (winning_color IN ('red', 'green', 'violet')),
  total_bets_amount NUMERIC(10,2) DEFAULT 0.00,
  total_players INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create color prediction bets table
CREATE TABLE public.color_prediction_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  round_id UUID NOT NULL REFERENCES public.color_prediction_rounds(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('red', 'green', 'violet')),
  bet_amount NUMERIC(10,2) NOT NULL CHECK (bet_amount > 0),
  payout_amount NUMERIC(10,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  multiplier NUMERIC(3,2) DEFAULT 2.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_color_prediction_rounds_status ON public.color_prediction_rounds(status);
CREATE INDEX idx_color_prediction_rounds_period ON public.color_prediction_rounds(period);
CREATE INDEX idx_color_prediction_bets_user_id ON public.color_prediction_bets(user_id);
CREATE INDEX idx_color_prediction_bets_round_id ON public.color_prediction_bets(round_id);

-- Enable RLS
ALTER TABLE public.color_prediction_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_prediction_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for rounds (anyone can view)
CREATE POLICY "Anyone can view color prediction rounds"
  ON public.color_prediction_rounds
  FOR SELECT
  USING (true);

-- RLS policies for bets (users can only see their own bets and create their own)
CREATE POLICY "Users can view their own color prediction bets"
  ON public.color_prediction_bets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own color prediction bets"
  ON public.color_prediction_bets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to place a color prediction bet
CREATE OR REPLACE FUNCTION public.place_color_prediction_bet(
  p_round_id UUID,
  p_color TEXT,
  p_bet_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
  v_multiplier NUMERIC(3,2);
BEGIN
  -- Get round details
  SELECT * INTO v_round
  FROM public.color_prediction_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Validate color
  IF p_color NOT IN ('red', 'green', 'violet') THEN
    RAISE EXCEPTION 'Invalid color selection';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 1 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹1';
  END IF;
  
  -- Check if user already has a bet for this round
  IF EXISTS (
    SELECT 1 FROM public.color_prediction_bets 
    WHERE round_id = p_round_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You have already placed a bet for this round';
  END IF;
  
  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = auth.uid();
  
  IF v_wallet_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Set multiplier (all colors have 2x payout)
  v_multiplier := 2.0;
  
  -- Deduct bet amount from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Color Prediction bet - Period: ' || v_round.period,
    'color_prediction',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.color_prediction_bets (
    user_id, round_id, color, bet_amount, multiplier
  ) VALUES (
    auth.uid(), p_round_id, p_color, p_bet_amount, v_multiplier
  ) RETURNING id INTO v_bet_id;
  
  -- Update round statistics
  UPDATE public.color_prediction_rounds
  SET 
    total_bets_amount = total_bets_amount + p_bet_amount,
    total_players = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.color_prediction_bets
      WHERE round_id = p_round_id
    ),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'color', p_color,
    'multiplier', v_multiplier
  );
END;
$$;

-- Function to process color prediction round
CREATE OR REPLACE FUNCTION public.process_color_prediction_round(
  p_round_id UUID,
  p_winning_color TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bet RECORD;
  v_payout_amount NUMERIC(10,2);
  v_total_payouts NUMERIC(10,2) := 0;
  v_total_bets INTEGER := 0;
  v_winning_bets INTEGER := 0;
BEGIN
  -- Validate winning color
  IF p_winning_color NOT IN ('red', 'green', 'violet') THEN
    RAISE EXCEPTION 'Invalid winning color';
  END IF;
  
  -- Update round status
  UPDATE public.color_prediction_rounds
  SET 
    status = 'completed',
    winning_color = p_winning_color,
    draw_time = NOW(),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Process all bets for this round
  FOR v_bet IN 
    SELECT * FROM public.color_prediction_bets 
    WHERE round_id = p_round_id AND status = 'pending'
  LOOP
    v_total_bets := v_total_bets + 1;
    
    IF v_bet.color = p_winning_color THEN
      -- Winning bet - calculate payout
      v_payout_amount := v_bet.bet_amount * v_bet.multiplier;
      v_total_payouts := v_total_payouts + v_payout_amount;
      v_winning_bets := v_winning_bets + 1;
      
      -- Update bet status
      UPDATE public.color_prediction_bets
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
        'Color Prediction win - Period: ' || (SELECT period FROM public.color_prediction_rounds WHERE id = p_round_id),
        'color_prediction',
        p_round_id
      );
    ELSE
      -- Losing bet
      UPDATE public.color_prediction_bets
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
    'winning_color', p_winning_color,
    'total_bets', v_total_bets,
    'winning_bets', v_winning_bets,
    'total_payouts', v_total_payouts
  );
END;
$$;

-- Enable realtime for color prediction tables
ALTER TABLE public.color_prediction_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.color_prediction_bets REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.color_prediction_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.color_prediction_bets;

