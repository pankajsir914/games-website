-- Create sports_bets table to track sports wagers
CREATE TABLE IF NOT EXISTS public.sports_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  event_id TEXT NOT NULL,
  market_type TEXT,
  selection TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('back', 'lay', 'yes', 'no')),
  odds NUMERIC(12,4) NOT NULL CHECK (odds > 1),
  stake NUMERIC(12,2) NOT NULL CHECK (stake > 0),
  potential_win NUMERIC(12,2) NOT NULL CHECK (potential_win >= 0),
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'placed',
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sports_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies: owners can insert/select their own bets
CREATE POLICY "Users can insert their own sports bets"
  ON public.sports_bets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sports bets"
  ON public.sports_bets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to place a sports bet and debit wallet atomically
CREATE OR REPLACE FUNCTION public.place_sports_bet(
  p_sport TEXT,
  p_event_id TEXT,
  p_market_type TEXT,
  p_selection TEXT,
  p_bet_type TEXT,
  p_odds NUMERIC,
  p_stake NUMERIC,
  p_provider TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_balance NUMERIC(12,2);
  v_bet_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_stake <= 0 THEN
    RAISE EXCEPTION 'Stake must be greater than 0';
  END IF;

  IF p_odds <= 1 THEN
    RAISE EXCEPTION 'Odds must be greater than 1';
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance IS NULL OR v_wallet_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Debit wallet
  PERFORM public.update_wallet_balance(
    v_user_id,
    p_stake,
    'debit',
    'Sports bet - ' || coalesce(p_sport, 'sport') || ' ' || coalesce(p_event_id, ''),
    'sports',
    p_event_id
  );

  -- Insert bet
  INSERT INTO public.sports_bets (
    user_id, sport, event_id, market_type, selection, bet_type, odds, stake, potential_win, provider, meta
  ) VALUES (
    v_user_id, p_sport, p_event_id, p_market_type, p_selection, p_bet_type, p_odds, p_stake,
    CASE 
      WHEN p_bet_type = 'lay' THEN p_stake -- lay wins stake
      ELSE p_stake * p_odds
    END,
    p_provider,
    p_meta
  )
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id
  );
END;
$$;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION public.place_sports_bet(
  TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, JSONB
) TO authenticated;


