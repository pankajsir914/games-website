-- Create andar_bahar_rounds table
CREATE TABLE IF NOT EXISTS public.andar_bahar_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  joker_card JSONB NOT NULL,
  andar_cards JSONB[] DEFAULT '{}',
  bahar_cards JSONB[] DEFAULT '{}',
  winning_side TEXT,
  winning_card JSONB,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'dealing', 'completed')),
  bet_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  game_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create andar_bahar_bets table
CREATE TABLE IF NOT EXISTS public.andar_bahar_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  round_id UUID NOT NULL REFERENCES public.andar_bahar_rounds(id) ON DELETE CASCADE,
  bet_side TEXT NOT NULL CHECK (bet_side IN ('andar', 'bahar')),
  bet_amount DECIMAL(10,2) NOT NULL CHECK (bet_amount > 0),
  payout_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.andar_bahar_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andar_bahar_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for andar_bahar_rounds
CREATE POLICY "Andar Bahar rounds are viewable by everyone" 
ON public.andar_bahar_rounds 
FOR SELECT 
USING (true);

-- RLS policies for andar_bahar_bets
CREATE POLICY "Users can view their own andar bahar bets" 
ON public.andar_bahar_bets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own andar bahar bets" 
ON public.andar_bahar_bets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to place andar bahar bet
CREATE OR REPLACE FUNCTION place_andar_bahar_bet(
  p_round_id UUID,
  p_bet_side TEXT,
  p_bet_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_round andar_bahar_rounds%ROWTYPE;
  v_bet_id UUID;
  v_current_balance DECIMAL;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if round exists and is in betting phase
  SELECT * INTO v_round FROM andar_bahar_rounds WHERE id = p_round_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found';
  END IF;
  
  IF v_round.status != 'betting' THEN
    RAISE EXCEPTION 'Betting is closed for this round';
  END IF;
  
  -- Check if betting time has expired
  IF v_round.bet_end_time <= now() THEN
    RAISE EXCEPTION 'Betting time has expired';
  END IF;

  -- Check if user already bet on this round
  IF EXISTS (SELECT 1 FROM andar_bahar_bets WHERE user_id = v_user_id AND round_id = p_round_id) THEN
    RAISE EXCEPTION 'You have already placed a bet on this round';
  END IF;

  -- Get user's current balance
  SELECT current_balance INTO v_current_balance FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND OR v_current_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct amount from wallet
  UPDATE wallets 
  SET current_balance = current_balance - p_bet_amount,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Create bet record
  INSERT INTO andar_bahar_bets (
    user_id, round_id, bet_side, bet_amount, status
  ) VALUES (
    v_user_id, p_round_id, p_bet_side, p_bet_amount, 'pending'
  ) RETURNING id INTO v_bet_id;

  -- Log transaction
  INSERT INTO transactions (
    user_id, transaction_type, amount, status, description, reference_id
  ) VALUES (
    v_user_id, 'bet', p_bet_amount, 'completed', 
    'Andar Bahar bet on ' || p_bet_side, v_bet_id::text
  );

  RETURN v_bet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process andar bahar round results
CREATE OR REPLACE FUNCTION process_andar_bahar_round(p_round_id UUID)
RETURNS void AS $$
DECLARE
  v_round andar_bahar_rounds%ROWTYPE;
  v_bet andar_bahar_bets%ROWTYPE;
  v_payout_multiplier DECIMAL;
  v_payout_amount DECIMAL;
BEGIN
  -- Get round details
  SELECT * INTO v_round FROM andar_bahar_rounds WHERE id = p_round_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found';
  END IF;

  -- Process each bet
  FOR v_bet IN SELECT * FROM andar_bahar_bets WHERE round_id = p_round_id AND status = 'pending'
  LOOP
    IF v_bet.bet_side = v_round.winning_side THEN
      -- Calculate payout (andar = 1.9x, bahar = 2.0x)
      v_payout_multiplier := CASE 
        WHEN v_bet.bet_side = 'andar' THEN 1.9 
        ELSE 2.0 
      END;
      
      v_payout_amount := v_bet.bet_amount * v_payout_multiplier;
      
      -- Update bet as won
      UPDATE andar_bahar_bets 
      SET status = 'won', 
          payout_amount = v_payout_amount,
          updated_at = now()
      WHERE id = v_bet.id;
      
      -- Add winnings to wallet
      UPDATE wallets 
      SET current_balance = current_balance + v_payout_amount,
          updated_at = now()
      WHERE user_id = v_bet.user_id;
      
      -- Log payout transaction
      INSERT INTO transactions (
        user_id, transaction_type, amount, status, description, reference_id
      ) VALUES (
        v_bet.user_id, 'win', v_payout_amount, 'completed', 
        'Andar Bahar win payout', v_bet.id::text
      );
    ELSE
      -- Update bet as lost
      UPDATE andar_bahar_bets 
      SET status = 'lost',
          updated_at = now()
      WHERE id = v_bet.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_andar_bahar_rounds_updated_at
  BEFORE UPDATE ON public.andar_bahar_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_andar_bahar_bets_updated_at
  BEFORE UPDATE ON public.andar_bahar_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default game settings for Andar Bahar
INSERT INTO game_settings (game_type, is_enabled, maintenance_mode, min_bet_amount, max_bet_amount, house_edge, settings)
VALUES (
  'andar_bahar',
  true,
  false,
  10.00,
  1000.00,
  5.0,
  '{
    "betting_duration": 30,
    "auto_start": true,
    "cheat_mode": false,
    "forced_winner": null
  }'::jsonb
) ON CONFLICT (game_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  min_bet_amount = EXCLUDED.min_bet_amount,
  max_bet_amount = EXCLUDED.max_bet_amount,
  house_edge = EXCLUDED.house_edge,
  settings = EXCLUDED.settings;