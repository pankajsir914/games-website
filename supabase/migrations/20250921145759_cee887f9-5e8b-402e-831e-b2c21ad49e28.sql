-- Security Fix Implementation

-- 1. Create missing security tables and fix RLS

-- Create roulette_live_bets table with proper RLS
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

DROP POLICY IF EXISTS "Users can view recent roulette live bets" ON public.roulette_live_bets;
CREATE POLICY "Users can view recent roulette live bets"
ON public.roulette_live_bets
FOR SELECT
USING (auth.uid() IS NOT NULL AND created_at >= NOW() - INTERVAL '1 hour');

-- Create ludo_player_sessions with proper RLS
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

-- 2. Security Audit Logging
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

DROP POLICY IF EXISTS "Only master admins can view security logs" ON public.security_audit_logs;
CREATE POLICY "Only master admins can view security logs"
ON public.security_audit_logs
FOR SELECT
USING (has_admin_role(auth.uid(), 'master_admin'));

-- 3. Failed Login Tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON public.failed_login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON public.failed_login_attempts(ip_address, attempted_at);

-- 4. User Sessions Management
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

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Admin IP Whitelist
CREATE TABLE IF NOT EXISTS public.admin_ip_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only master admins can manage IP whitelist" ON public.admin_ip_whitelist;
CREATE POLICY "Only master admins can manage IP whitelist"
ON public.admin_ip_whitelist
FOR ALL
USING (has_admin_role(auth.uid(), 'master_admin'));

-- 6. Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON public.rate_limit_tracking(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON public.rate_limit_tracking(ip_address, endpoint, window_start);

-- 7. Security Functions

-- Function to track failed login attempts
CREATE OR REPLACE FUNCTION public.track_failed_login(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO failed_login_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip_address, p_user_agent);
  
  -- Check if too many failed attempts
  IF (SELECT COUNT(*) FROM failed_login_attempts 
      WHERE email = p_email 
      AND attempted_at > NOW() - INTERVAL '15 minutes') > 5 THEN
    
    -- Create security alert
    INSERT INTO admin_alerts (
      alert_type, 
      severity, 
      title, 
      description,
      data
    ) VALUES (
      'security',
      'high',
      'Multiple Failed Login Attempts',
      format('User %s has failed to login multiple times', p_email),
      jsonb_build_object('email', p_email, 'ip_address', p_ip_address::text)
    );
  END IF;
END;
$function$;

-- Function to validate session
CREATE OR REPLACE FUNCTION public.validate_session(
  p_session_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE session_token = p_session_token
  AND is_active = true
  AND expires_at > NOW();
  
  IF v_user_id IS NOT NULL THEN
    -- Update last activity
    UPDATE user_sessions
    SET last_activity = NOW()
    WHERE session_token = p_session_token;
  END IF;
  
  RETURN v_user_id;
END;
$function$;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_endpoint TEXT DEFAULT 'api',
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request_count INTEGER;
BEGIN
  -- Check user-based rate limit if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_request_count
    FROM rate_limit_tracking
    WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    IF v_request_count >= p_max_requests THEN
      RETURN FALSE;
    END IF;
    
    -- Track request
    INSERT INTO rate_limit_tracking (user_id, endpoint)
    VALUES (p_user_id, p_endpoint);
  END IF;
  
  -- Check IP-based rate limit if IP provided
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO v_request_count
    FROM rate_limit_tracking
    WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    IF v_request_count >= p_max_requests THEN
      RETURN FALSE;
    END IF;
    
    -- Track request
    INSERT INTO rate_limit_tracking (ip_address, endpoint)
    VALUES (p_ip_address, p_endpoint);
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_request_data JSONB DEFAULT NULL,
  p_response_status INTEGER DEFAULT 200
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO security_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    request_data,
    response_status
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_request_data,
    p_response_status
  );
END;
$function$;