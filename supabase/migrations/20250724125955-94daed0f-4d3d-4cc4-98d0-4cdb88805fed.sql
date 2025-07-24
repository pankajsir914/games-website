
-- Create Andar Bahar game rounds table
CREATE TABLE public.andar_bahar_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  joker_card JSONB NOT NULL,
  andar_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  bahar_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  winning_side TEXT CHECK (winning_side IN ('andar', 'bahar')),
  winning_card JSONB,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'dealing', 'completed')),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  game_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Andar Bahar bets table
CREATE TABLE public.andar_bahar_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  round_id UUID NOT NULL REFERENCES public.andar_bahar_rounds(id),
  bet_side TEXT NOT NULL CHECK (bet_side IN ('andar', 'bahar')),
  bet_amount NUMERIC(10,2) NOT NULL CHECK (bet_amount > 0),
  payout_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.andar_bahar_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andar_bahar_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for rounds (everyone can view, admin can manage)
CREATE POLICY "Anyone can view andar bahar rounds" ON public.andar_bahar_rounds
  FOR SELECT USING (true);

-- RLS policies for bets
CREATE POLICY "Users can view their own andar bahar bets" ON public.andar_bahar_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own andar bahar bets" ON public.andar_bahar_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to place a bet
CREATE OR REPLACE FUNCTION public.place_andar_bahar_bet(
  p_round_id UUID,
  p_bet_side TEXT,
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
  FROM public.andar_bahar_rounds
  WHERE id = p_round_id AND status = 'betting' AND bet_end_time > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found or betting period ended';
  END IF;
  
  -- Validate bet side
  IF p_bet_side NOT IN ('andar', 'bahar') THEN
    RAISE EXCEPTION 'Invalid bet side';
  END IF;
  
  -- Validate bet amount
  IF p_bet_amount < 10 THEN
    RAISE EXCEPTION 'Minimum bet amount is ₹10';
  END IF;
  
  -- Check if user already has a bet for this round
  IF EXISTS (
    SELECT 1 FROM public.andar_bahar_bets 
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
    'Andar Bahar bet - Round: ' || v_round.round_number,
    'casino',
    p_round_id
  );
  
  -- Create bet record
  INSERT INTO public.andar_bahar_bets (
    user_id, round_id, bet_side, bet_amount
  ) VALUES (
    auth.uid(), p_round_id, p_bet_side, p_bet_amount
  ) RETURNING id INTO v_bet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'bet_amount', p_bet_amount,
    'bet_side', p_bet_side
  );
END;
$function$;

-- Function to process round results and payouts
CREATE OR REPLACE FUNCTION public.process_andar_bahar_round(
  p_round_id UUID,
  p_winning_side TEXT,
  p_winning_card JSONB
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_bet RECORD;
  v_payout_multiplier NUMERIC := 1.9; -- Default payout
  v_payout_amount NUMERIC(10,2);
  v_total_payouts NUMERIC(10,2) := 0;
  v_total_bets INTEGER := 0;
  v_winning_bets INTEGER := 0;
BEGIN
  -- Update round status
  UPDATE public.andar_bahar_rounds
  SET 
    status = 'completed',
    winning_side = p_winning_side,
    winning_card = p_winning_card,
    game_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Set payout multipliers (Andar typically has slightly lower odds)
  IF p_winning_side = 'andar' THEN
    v_payout_multiplier := 1.9;
  ELSE
    v_payout_multiplier := 2.0;
  END IF;
  
  -- Process all bets for this round
  FOR v_bet IN 
    SELECT * FROM public.andar_bahar_bets 
    WHERE round_id = p_round_id AND status = 'pending'
  LOOP
    v_total_bets := v_total_bets + 1;
    
    IF v_bet.bet_side = p_winning_side THEN
      -- Winning bet - calculate payout
      v_payout_amount := v_bet.bet_amount * v_payout_multiplier;
      v_total_payouts := v_total_payouts + v_payout_amount;
      v_winning_bets := v_winning_bets + 1;
      
      -- Update bet status
      UPDATE public.andar_bahar_bets
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
        'Andar Bahar win - Round: ' || (SELECT round_number FROM public.andar_bahar_rounds WHERE id = p_round_id),
        'casino',
        p_round_id
      );
    ELSE
      -- Losing bet
      UPDATE public.andar_bahar_bets
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
    'winning_side', p_winning_side,
    'total_bets', v_total_bets,
    'winning_bets', v_winning_bets,
    'total_payouts', v_total_payouts
  );
END;
$function$;

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.andar_bahar_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.andar_bahar_bets;

-- Set replica identity for realtime updates
ALTER TABLE public.andar_bahar_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.andar_bahar_bets REPLICA IDENTITY FULL;

-- Create index for performance
CREATE INDEX idx_andar_bahar_rounds_status ON public.andar_bahar_rounds(status);
CREATE INDEX idx_andar_bahar_rounds_created_at ON public.andar_bahar_rounds(created_at DESC);
CREATE INDEX idx_andar_bahar_bets_user_round ON public.andar_bahar_bets(user_id, round_id);
