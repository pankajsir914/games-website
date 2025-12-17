
-- Create aviator_rounds table to track game rounds
CREATE TABLE public.aviator_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  crash_multiplier NUMERIC(10,3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'flying', 'crashed')),
  bet_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  crash_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aviator_bets table to track user bets
CREATE TABLE public.aviator_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  round_id UUID NOT NULL REFERENCES public.aviator_rounds(id),
  bet_amount NUMERIC(10,2) NOT NULL,
  auto_cashout_multiplier NUMERIC(10,3),
  cashout_multiplier NUMERIC(10,3),
  cashout_time TIMESTAMP WITH TIME ZONE,
  payout_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cashed_out', 'crashed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.aviator_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aviator_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for aviator_rounds (anyone can view rounds)
CREATE POLICY "Anyone can view aviator rounds"
  ON public.aviator_rounds
  FOR SELECT
  USING (true);

-- RLS policies for aviator_bets
CREATE POLICY "Users can create their own aviator bets"
  ON public.aviator_bets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own aviator bets"
  ON public.aviator_bets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own aviator bets"
  ON public.aviator_bets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to place an aviator bet
CREATE OR REPLACE FUNCTION public.place_aviator_bet(
  p_round_id UUID,
  p_bet_amount NUMERIC,
  p_auto_cashout_multiplier NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round RECORD;
  v_wallet_balance NUMERIC(10,2);
  v_bet_id UUID;
BEGIN
  -- Get round details
  SELECT * INTO v_round
  FROM public.aviator_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 10 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹10';
  END IF;
  
  -- Check if user already has a bet for this round
  IF EXISTS (
    SELECT 1 FROM public.aviator_bets 
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
  
  -- Deduct bet amount from wallet
  PERFORM public.update_wallet_balance(
    auth.uid(),
    p_bet_amount,
    'debit',
    'Aviator bet - Round: ' || v_round.round_number,
    'aviator',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.aviator_bets (
    user_id, round_id, bet_amount, auto_cashout_multiplier
  ) VALUES (
    auth.uid(), p_round_id, p_bet_amount, p_auto_cashout_multiplier
  ) RETURNING id INTO v_bet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'auto_cashout_multiplier', p_auto_cashout_multiplier
  );
END;
$$;

-- Function to cash out an aviator bet
CREATE OR REPLACE FUNCTION public.cashout_aviator_bet(
  p_bet_id UUID,
  p_current_multiplier NUMERIC
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bet RECORD;
  v_round RECORD;
  v_payout_amount NUMERIC(10,2);
BEGIN
  -- Get bet details
  SELECT * INTO v_bet
  FROM public.aviator_bets
  WHERE id = p_bet_id AND user_id = auth.uid() AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or already processed';
  END IF;
  
  -- Get round details
  SELECT * INTO v_round
  FROM public.aviator_rounds
  WHERE id = v_bet.round_id AND status = 'flying';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or not in flying state';
  END IF;
  
  -- Calculate payout
  v_payout_amount := v_bet.bet_amount * p_current_multiplier;
  
  -- Update bet status
  UPDATE public.aviator_bets
  SET 
    status = 'cashed_out',
    cashout_multiplier = p_current_multiplier,
    cashout_time = NOW(),
    payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_bet_id;
  
  -- Credit wallet with payout
  PERFORM public.update_wallet_balance(
    auth.uid(),
    v_payout_amount,
    'credit',
    'Aviator cashout - Round: ' || v_round.round_number || ' at ' || p_current_multiplier || 'x',
    'aviator',
    v_bet.round_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payout_amount', v_payout_amount,
    'cashout_multiplier', p_current_multiplier
  );
END;
$$;

-- Function to process round crash
CREATE OR REPLACE FUNCTION public.process_aviator_crash(
  p_round_id UUID,
  p_crash_multiplier NUMERIC
)
RETURNS jsonb
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
  -- Update round status
  UPDATE public.aviator_rounds
  SET 
    status = 'crashed',
    crash_multiplier = p_crash_multiplier,
    crash_time = NOW(),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Process all active bets for this round
  FOR v_bet IN 
    SELECT * FROM public.aviator_bets 
    WHERE round_id = p_round_id AND status = 'active'
  LOOP
    v_total_bets := v_total_bets + 1;
    
    -- Check if bet should auto-cashout
    IF v_bet.auto_cashout_multiplier IS NOT NULL AND 
       v_bet.auto_cashout_multiplier <= p_crash_multiplier THEN
      -- Auto cashout
      v_payout_amount := v_bet.bet_amount * v_bet.auto_cashout_multiplier;
      v_total_payouts := v_total_payouts + v_payout_amount;
      v_winning_bets := v_winning_bets + 1;
      
      -- Update bet status
      UPDATE public.aviator_bets
      SET 
        status = 'cashed_out',
        cashout_multiplier = v_bet.auto_cashout_multiplier,
        cashout_time = NOW(),
        payout_amount = v_payout_amount,
        updated_at = NOW()
      WHERE id = v_bet.id;
      
      -- Credit wallet
      PERFORM public.update_wallet_balance(
        v_bet.user_id,
        v_payout_amount,
        'credit',
        'Aviator auto-cashout - Round: ' || (SELECT round_number FROM public.aviator_rounds WHERE id = p_round_id) || ' at ' || v_bet.auto_cashout_multiplier || 'x',
        'aviator',
        p_round_id
      );
    ELSE
      -- Bet crashed
      UPDATE public.aviator_bets
      SET 
        status = 'crashed',
        updated_at = NOW()
      WHERE id = v_bet.id;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'round_id', p_round_id,
    'crash_multiplier', p_crash_multiplier,
    'total_bets', v_total_bets,
    'winning_bets', v_winning_bets,
    'total_payouts', v_total_payouts
  );
END;
$$;

-- Enable realtime for aviator tables
ALTER TABLE public.aviator_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.aviator_bets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aviator_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aviator_bets;
