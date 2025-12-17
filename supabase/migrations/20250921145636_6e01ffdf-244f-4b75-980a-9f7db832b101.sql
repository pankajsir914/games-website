-- Fix RLS policies for exposed tables

-- 1. aviator_live_bets - Make it read-only for authenticated users
ALTER TABLE public.aviator_live_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recent aviator live bets"
ON public.aviator_live_bets
FOR SELECT
USING (auth.uid() IS NOT NULL AND created_at >= NOW() - INTERVAL '1 hour');

-- 2. roulette_live_bets (create table if doesn't exist and add RLS)
CREATE TABLE IF NOT EXISTS public.roulette_live_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  round_id UUID,
  bet_amount NUMERIC(10,2),
  bet_type TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.roulette_live_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recent roulette live bets"
ON public.roulette_live_bets
FOR SELECT
USING (auth.uid() IS NOT NULL AND created_at >= NOW() - INTERVAL '1 hour');

-- 3. Fix poker_game_events - Restrict to game participants
DROP POLICY IF EXISTS "Players can view events for games they're in" ON public.poker_game_events;

CREATE POLICY "Players can view events for games they're in"
ON public.poker_game_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM poker_players pp
    JOIN poker_games pg ON pg.table_id = pp.table_id
    WHERE pg.id = poker_game_events.game_id 
    AND pp.user_id = auth.uid()
    AND pp.status = 'active'
  )
);

-- 4. Fix ludo_player_sessions (create if doesn't exist)
CREATE TABLE IF NOT EXISTS public.ludo_player_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID,
  session_data JSONB DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ludo_player_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ludo sessions" ON public.ludo_player_sessions;
DROP POLICY IF EXISTS "Users can insert own ludo sessions" ON public.ludo_player_sessions;
DROP POLICY IF EXISTS "Users can update own ludo sessions" ON public.ludo_player_sessions;

CREATE POLICY "Users can view own ludo sessions"
ON public.ludo_player_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ludo sessions"
ON public.ludo_player_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ludo sessions"
ON public.ludo_player_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC(10,2),
  p_type TEXT,
  p_reason TEXT,
  p_category TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_balance NUMERIC(10,2);
  v_new_balance NUMERIC(10,2);
  v_transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  IF p_type NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;
  
  -- Lock the wallet row for update
  SELECT current_balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create wallet if it doesn't exist
    INSERT INTO wallets (user_id, current_balance)
    VALUES (p_user_id, 0)
    RETURNING current_balance INTO v_current_balance;
  END IF;
  
  -- Calculate new balance
  IF p_type = 'credit' THEN
    v_new_balance := v_current_balance + p_amount;
  ELSE
    v_new_balance := v_current_balance - p_amount;
  END IF;
  
  -- Check for sufficient balance on debit
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update wallet balance
  UPDATE wallets
  SET 
    current_balance = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    type,
    balance_after,
    reason,
    category,
    reference_id
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    v_new_balance,
    p_reason,
    p_category,
    p_reference_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$function$;

-- 6. Add audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_data JSONB,
  response_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only master admins can view security logs"
ON public.security_audit_logs
FOR SELECT
USING (has_admin_role(auth.uid(), 'master_admin'));

-- 7. Create table for failed login attempts
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_failed_login_email ON public.failed_login_attempts(email, attempted_at);
CREATE INDEX idx_failed_login_ip ON public.failed_login_attempts(ip_address, attempted_at);

-- 8. Add user session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 9. Add IP whitelist for admin access
CREATE TABLE IF NOT EXISTS public.admin_ip_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only master admins can manage IP whitelist"
ON public.admin_ip_whitelist
FOR ALL
USING (has_admin_role(auth.uid(), 'master_admin'));

-- 10. Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_user ON public.rate_limit_tracking(user_id, endpoint, window_start);
CREATE INDEX idx_rate_limit_ip ON public.rate_limit_tracking(ip_address, endpoint, window_start);