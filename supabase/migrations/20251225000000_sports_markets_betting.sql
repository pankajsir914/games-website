-- =====================================================
-- SPORTS MARKETS BETTING SYSTEM
-- Supports ODDS-based and SESSION-based markets
-- =====================================================

-- Market Types Enum
CREATE TYPE market_category AS ENUM ('odds', 'session');
CREATE TYPE market_status AS ENUM ('open', 'suspended', 'closed', 'settled', 'void');
CREATE TYPE bet_status AS ENUM ('placed', 'won', 'lost', 'void', 'refunded');
CREATE TYPE suspension_reason AS ENUM ('wicket', 'no_ball', 'review', 'other');

-- =====================================================
-- MARKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sports_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  market_name TEXT NOT NULL,
  market_type market_category NOT NULL,
  
  -- ODDS market fields
  selection TEXT, -- e.g., "Team A", "Toss - Heads", "Odd"
  odds_back NUMERIC(12,4), -- Back odds (e.g., 2.5)
  odds_lay NUMERIC(12,4), -- Lay odds (e.g., 2.6)
  
  -- SESSION market fields
  line_value NUMERIC(10,2), -- Line (e.g., 45.5 runs)
  rate_yes NUMERIC(8,2), -- YES rate (e.g., 95)
  rate_no NUMERIC(8,2), -- NO rate (e.g., 105)
  
  -- Common fields
  status market_status NOT NULL DEFAULT 'open',
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason suspension_reason,
  suspended_at TIMESTAMPTZ,
  
  -- Line shift tracking (for SESSION markets)
  current_line NUMERIC(10,2), -- Current active line
  line_history JSONB DEFAULT '[]'::jsonb, -- Track line changes with timestamps
  
  -- Settlement
  result_value NUMERIC(10,2), -- Actual result (runs, wickets, etc.)
  winning_selection TEXT, -- Winning selection for ODDS markets
  settled_at TIMESTAMPTZ,
  
  -- Metadata
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- BETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sports_market_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.sports_markets(id) ON DELETE CASCADE,
  
  -- Bet details
  market_type market_category NOT NULL,
  bet_side TEXT NOT NULL, -- 'back', 'lay' for ODDS; 'yes', 'no' for SESSION
  stake NUMERIC(12,2) NOT NULL CHECK (stake > 0),
  
  -- ODDS market bet fields
  odds NUMERIC(12,4), -- Odds at time of bet
  selection TEXT, -- Selection for ODDS markets
  
  -- SESSION market bet fields
  line_at_bet NUMERIC(10,2), -- Line value when bet was placed
  rate_at_bet NUMERIC(8,2), -- Rate (bhaav) when bet was placed
  
  -- Calculations
  exposure NUMERIC(12,2) NOT NULL, -- Amount at risk
  potential_profit NUMERIC(12,2) NOT NULL, -- Potential profit if wins
  
  -- Status
  status bet_status NOT NULL DEFAULT 'placed',
  profit_loss NUMERIC(12,2), -- Actual P&L after settlement
  
  -- Settlement
  settled_at TIMESTAMPTZ,
  settlement_reason TEXT,
  
  -- Metadata
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- MARKET SUSPENSION LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.market_suspension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.sports_markets(id) ON DELETE CASCADE,
  reason suspension_reason NOT NULL,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_sports_markets_event_id ON public.sports_markets(event_id);
CREATE INDEX idx_sports_markets_status ON public.sports_markets(status);
CREATE INDEX idx_sports_markets_market_type ON public.sports_markets(market_type);
CREATE INDEX idx_sports_market_bets_user_id ON public.sports_market_bets(user_id);
CREATE INDEX idx_sports_market_bets_market_id ON public.sports_market_bets(market_id);
CREATE INDEX idx_sports_market_bets_status ON public.sports_market_bets(status);
CREATE INDEX idx_sports_market_bets_created_at ON public.sports_market_bets(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.sports_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_market_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_suspension_logs ENABLE ROW LEVEL SECURITY;

-- Markets: Everyone can view, admins can manage
CREATE POLICY "Anyone can view sports markets"
  ON public.sports_markets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sports markets"
  ON public.sports_markets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Bets: Users can view/insert their own bets
CREATE POLICY "Users can view their own bets"
  ON public.sports_market_bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets"
  ON public.sports_market_bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bets"
  ON public.sports_market_bets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Suspension logs: Admins only
CREATE POLICY "Admins can view suspension logs"
  ON public.market_suspension_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate exposure for ODDS market
CREATE OR REPLACE FUNCTION calculate_odds_exposure(
  p_stake NUMERIC,
  p_bet_side TEXT,
  p_odds NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_bet_side = 'back' THEN
    -- Back: exposure is the stake
    RETURN p_stake;
  ELSIF p_bet_side = 'lay' THEN
    -- Lay: exposure is potential liability = stake * (odds - 1)
    RETURN p_stake * (p_odds - 1);
  ELSE
    RAISE EXCEPTION 'Invalid bet_side for ODDS market: %', p_bet_side;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate potential profit for ODDS market
CREATE OR REPLACE FUNCTION calculate_odds_profit(
  p_stake NUMERIC,
  p_bet_side TEXT,
  p_odds NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_bet_side = 'back' THEN
    -- Back: profit = stake * (odds - 1)
    RETURN p_stake * (p_odds - 1);
  ELSIF p_bet_side = 'lay' THEN
    -- Lay: profit is the stake itself
    RETURN p_stake;
  ELSE
    RAISE EXCEPTION 'Invalid bet_side for ODDS market: %', p_bet_side;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate exposure for SESSION market
CREATE OR REPLACE FUNCTION calculate_session_exposure(
  p_stake NUMERIC,
  p_bet_side TEXT,
  p_rate NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_bet_side = 'yes' THEN
    -- YES: exposure = stake (if NO wins, lose stake)
    RETURN p_stake;
  ELSIF p_bet_side = 'no' THEN
    -- NO: exposure = stake * rate / 100 (if YES wins, lose stake * rate/100)
    RETURN p_stake * p_rate / 100;
  ELSE
    RAISE EXCEPTION 'Invalid bet_side for SESSION market: %', p_bet_side;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate potential profit for SESSION market
CREATE OR REPLACE FUNCTION calculate_session_profit(
  p_stake NUMERIC,
  p_bet_side TEXT,
  p_rate NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_bet_side = 'yes' THEN
    -- YES: profit = stake * rate / 100
    RETURN p_stake * p_rate / 100;
  ELSIF p_bet_side = 'no' THEN
    -- NO: profit = stake (if NO wins, win stake)
    RETURN p_stake;
  ELSE
    RAISE EXCEPTION 'Invalid bet_side for SESSION market: %', p_bet_side;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- BET PLACEMENT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.place_market_bet(
  p_market_id UUID,
  p_bet_side TEXT, -- 'back'/'lay' for ODDS, 'yes'/'no' for SESSION
  p_stake NUMERIC,
  p_selection TEXT DEFAULT NULL, -- For ODDS markets
  p_odds NUMERIC DEFAULT NULL, -- For validation in ODDS markets
  p_rate NUMERIC DEFAULT NULL -- For validation in SESSION markets
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market RECORD;
  v_wallet_balance NUMERIC(12,2);
  v_exposure NUMERIC(12,2);
  v_potential_profit NUMERIC(12,2);
  v_bet_id UUID;
  v_validation_error TEXT;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate stake
  IF p_stake <= 0 THEN
    RAISE EXCEPTION 'Stake must be greater than 0';
  END IF;

  -- Get market with lock
  SELECT * INTO v_market
  FROM public.sports_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found';
  END IF;

  -- Validate market is open
  IF v_market.status != 'open' THEN
    RAISE EXCEPTION 'Market is not open. Current status: %', v_market.status;
  END IF;

  IF v_market.is_suspended = true THEN
    RAISE EXCEPTION 'Market is currently suspended';
  END IF;

  -- Market type specific validation
  IF v_market.market_type = 'odds' THEN
    -- ODDS market validation
    IF p_bet_side NOT IN ('back', 'lay') THEN
      RAISE EXCEPTION 'Invalid bet_side for ODDS market. Must be "back" or "lay"';
    END IF;

    IF p_selection IS NULL THEN
      RAISE EXCEPTION 'Selection is required for ODDS markets';
    END IF;

    IF p_selection != v_market.selection THEN
      RAISE EXCEPTION 'Selection mismatch. Market selection: %, provided: %', v_market.selection, p_selection;
    END IF;

    -- Validate odds match
    IF p_bet_side = 'back' THEN
      IF p_odds IS NOT NULL AND ABS(p_odds - v_market.odds_back) > 0.01 THEN
        RAISE EXCEPTION 'Odds mismatch. Market back odds: %, provided: %', v_market.odds_back, p_odds;
      END IF;
      v_exposure := calculate_odds_exposure(p_stake, 'back', v_market.odds_back);
      v_potential_profit := calculate_odds_profit(p_stake, 'back', v_market.odds_back);
    ELSIF p_bet_side = 'lay' THEN
      IF p_odds IS NOT NULL AND ABS(p_odds - v_market.odds_lay) > 0.01 THEN
        RAISE EXCEPTION 'Odds mismatch. Market lay odds: %, provided: %', v_market.odds_lay, p_odds;
      END IF;
      v_exposure := calculate_odds_exposure(p_stake, 'lay', v_market.odds_lay);
      v_potential_profit := calculate_odds_profit(p_stake, 'lay', v_market.odds_lay);
    END IF;

  ELSIF v_market.market_type = 'session' THEN
    -- SESSION market validation
    IF p_bet_side NOT IN ('yes', 'no') THEN
      RAISE EXCEPTION 'Invalid bet_side for SESSION market. Must be "yes" or "no"';
    END IF;

    -- Validate rate match
    IF p_bet_side = 'yes' THEN
      IF p_rate IS NOT NULL AND ABS(p_rate - v_market.rate_yes) > 0.1 THEN
        RAISE EXCEPTION 'Rate mismatch. Market YES rate: %, provided: %', v_market.rate_yes, p_rate;
      END IF;
      v_exposure := calculate_session_exposure(p_stake, 'yes', v_market.rate_yes);
      v_potential_profit := calculate_session_profit(p_stake, 'yes', v_market.rate_yes);
    ELSIF p_bet_side = 'no' THEN
      IF p_rate IS NOT NULL AND ABS(p_rate - v_market.rate_no) > 0.1 THEN
        RAISE EXCEPTION 'Rate mismatch. Market NO rate: %, provided: %', v_market.rate_no, p_rate;
      END IF;
      v_exposure := calculate_session_exposure(p_stake, 'no', v_market.rate_no);
      v_potential_profit := calculate_session_profit(p_stake, 'no', v_market.rate_no);
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid market type: %', v_market.market_type;
  END IF;

  -- Check wallet balance
  SELECT current_balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet_balance < v_exposure THEN
    RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', v_exposure, v_wallet_balance;
  END IF;

  -- Debit wallet (atomic transaction)
  PERFORM public.update_wallet_balance(
    v_user_id,
    v_exposure,
    'debit',
    format('Market bet - %s %s', v_market.market_name, p_bet_side),
    NULL,
    NULL
  );

  -- Insert bet
  INSERT INTO public.sports_market_bets (
    user_id,
    market_id,
    market_type,
    bet_side,
    stake,
    odds,
    selection,
    line_at_bet,
    rate_at_bet,
    exposure,
    potential_profit,
    status
  ) VALUES (
    v_user_id,
    p_market_id,
    v_market.market_type,
    p_bet_side,
    p_stake,
    CASE WHEN v_market.market_type = 'odds' THEN 
      CASE WHEN p_bet_side = 'back' THEN v_market.odds_back ELSE v_market.odds_lay END
    ELSE NULL END,
    p_selection,
    CASE WHEN v_market.market_type = 'session' THEN v_market.current_line ELSE NULL END,
    CASE WHEN v_market.market_type = 'session' THEN 
      CASE WHEN p_bet_side = 'yes' THEN v_market.rate_yes ELSE v_market.rate_no END
    ELSE NULL END,
    v_exposure,
    v_potential_profit,
    'placed'
  ) RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'exposure', v_exposure,
    'potential_profit', v_potential_profit,
    'new_balance', v_wallet_balance - v_exposure
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.place_market_bet(
  UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC
) TO authenticated;

