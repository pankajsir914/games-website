-- Security Fix - Final Simplified Approach

-- Just add RLS policies to the newly created security tables
-- The functions already exist, we'll leave them as is

-- 1. RLS for Rate Limiting
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rate limit tracking is managed by system"
ON public.rate_limit_tracking
FOR ALL
USING (true);

-- 2. RLS for Failed Login Attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only master admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "System can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
WITH CHECK (true);

-- 3. RLS for Security Audit Logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- 4. Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Delete old failed login attempts (>30 days)
  DELETE FROM failed_login_attempts 
  WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  -- Delete old rate limit tracking (>7 days)
  DELETE FROM rate_limit_tracking 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Delete expired sessions
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
  
  -- Log cleanup
  INSERT INTO security_audit_logs (action, resource_type)
  VALUES ('cleanup_old_security_data', 'system');
END;
$function$;