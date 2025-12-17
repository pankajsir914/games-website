-- Security Enhancement: Fix function search paths for all admin functions
-- This fixes the security warnings from the linter

-- Create a comprehensive admin session tracking table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '8 hours'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only master admins can view admin sessions
CREATE POLICY "Master admins can view admin sessions" ON public.admin_sessions
  FOR SELECT USING (has_admin_role(auth.uid(), 'master_admin'));

-- Create admin security settings table
CREATE TABLE IF NOT EXISTS public.admin_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security settings
ALTER TABLE public.admin_security_settings ENABLE ROW LEVEL SECURITY;

-- Only master admins can manage security settings
CREATE POLICY "Master admins can manage security settings" ON public.admin_security_settings
  FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

-- Insert default security settings
INSERT INTO public.admin_security_settings (setting_key, setting_value) VALUES
  ('session_timeout_hours', '8'),
  ('max_failed_attempts', '5'),
  ('lockout_duration_minutes', '15'),
  ('require_2fa', 'false'),
  ('allowed_ip_ranges', '[]'),
  ('security_headers_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Enhanced admin activity logging function with better security
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_ip_address INET;
  v_user_agent TEXT;
BEGIN
  -- Get IP address and user agent from context if available
  BEGIN
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
    v_user_agent := NULL;
  END;

  -- Insert admin activity log
  INSERT INTO public.admin_activity_logs (
    admin_id, action_type, target_type, target_id, details, ip_address, user_agent
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
    p_action_type, p_target_type, p_target_id, 
    COALESCE(p_details, '{}'::jsonb) || jsonb_build_object(
      'timestamp', NOW(),
      'session_id', current_setting('request.jwt.claims', true)::jsonb->>'sub'
    ),
    v_ip_address, v_user_agent
  ) RETURNING id INTO v_log_id;

  -- Create alert for critical actions
  IF p_action_type IN ('unauthorized_master_admin_access', 'user_status_update', 'admin_role_assignment') THEN
    INSERT INTO public.admin_alerts (
      alert_type, severity, title, description, data
    ) VALUES (
      'security_event',
      CASE 
        WHEN p_action_type = 'unauthorized_master_admin_access' THEN 'high'
        ELSE 'medium'
      END,
      'Security Event: ' || p_action_type,
      'Admin action requiring attention: ' || p_action_type,
      jsonb_build_object(
        'action_type', p_action_type,
        'admin_id', auth.uid(),
        'details', p_details,
        'log_id', v_log_id
      )
    );
  END IF;

  RETURN v_log_id;
END;
$$;

-- Enhanced session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_valid BOOLEAN := false;
  v_user_role TEXT;
  v_last_activity TIMESTAMP WITH TIME ZONE;
  v_session_timeout INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Get user role
  SELECT public.get_user_highest_role(auth.uid()) INTO v_user_role;
  
  -- Only allow master admins and admins
  IF v_user_role NOT IN ('master_admin', 'admin') THEN
    -- Log unauthorized access attempt
    PERFORM public.log_admin_activity(
      'unauthorized_admin_session_attempt',
      'auth',
      auth.uid(),
      jsonb_build_object('actual_role', v_user_role)
    );
    RETURN false;
  END IF;

  -- Get session timeout setting
  SELECT (setting_value::TEXT)::INTEGER INTO v_session_timeout
  FROM public.admin_security_settings 
  WHERE setting_key = 'session_timeout_hours';
  
  v_session_timeout := COALESCE(v_session_timeout, 8);

  -- Check if session exists and is active
  SELECT last_activity INTO v_last_activity
  FROM public.admin_sessions
  WHERE admin_id = auth.uid() 
    AND is_active = true
    AND expires_at > NOW()
    AND last_activity > (NOW() - (v_session_timeout || ' hours')::INTERVAL);

  IF FOUND THEN
    -- Update last activity
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE admin_id = auth.uid() AND is_active = true;
    
    v_session_valid := true;
  ELSE
    -- Log session timeout/invalid
    PERFORM public.log_admin_activity(
      'admin_session_timeout',
      'auth',
      auth.uid()
    );
  END IF;

  RETURN v_session_valid;
END;
$$;

-- Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_admin_input(
  p_input TEXT,
  p_input_type TEXT DEFAULT 'general',
  p_max_length INTEGER DEFAULT 255
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sanitized TEXT;
  v_patterns TEXT[];
BEGIN
  -- Return null if input is null
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;

  -- Trim whitespace
  v_sanitized := TRIM(p_input);
  
  -- Check length
  IF LENGTH(v_sanitized) > p_max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of % characters', p_max_length;
  END IF;

  -- Define dangerous patterns based on input type
  CASE p_input_type
    WHEN 'email' THEN
      -- Email validation
      IF v_sanitized !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
      END IF;
    WHEN 'sql' THEN
      -- SQL injection prevention
      v_patterns := ARRAY[
        '(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)',
        '(--|#|/\*|\*/)',
        '(''|"|;|\||&)'
      ];
    WHEN 'html' THEN
      -- XSS prevention
      v_patterns := ARRAY[
        '(<script|</script>|javascript:|vbscript:|onload|onerror|onclick)',
        '(<iframe|<object|<embed|<form)'
      ];
    ELSE
      -- General dangerous patterns
      v_patterns := ARRAY[
        '(<script|</script>|javascript:|vbscript:)',
        '(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)'
      ];
  END CASE;

  -- Check for dangerous patterns
  IF array_length(v_patterns, 1) > 0 THEN
    FOR i IN 1..array_length(v_patterns, 1) LOOP
      IF v_sanitized ~* v_patterns[i] THEN
        -- Log potential attack
        PERFORM public.log_admin_activity(
          'potential_injection_attempt',
          'security',
          auth.uid(),
          jsonb_build_object(
            'input_type', p_input_type,
            'pattern_matched', v_patterns[i],
            'original_input', left(p_input, 100)
          )
        );
        RAISE EXCEPTION 'Input contains potentially dangerous content';
      END IF;
    END LOOP;
  END IF;

  RETURN v_sanitized;
END;
$$;

-- Create function to check IP whitelist
CREATE OR REPLACE FUNCTION public.check_admin_ip_whitelist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_ip INET;
  v_allowed_ranges JSONB;
  v_range TEXT;
  v_is_allowed BOOLEAN := true; -- Default to allowed if no restrictions
BEGIN
  -- Get client IP
  v_client_ip := inet_client_addr();
  
  -- Get allowed IP ranges
  SELECT setting_value INTO v_allowed_ranges
  FROM public.admin_security_settings
  WHERE setting_key = 'allowed_ip_ranges';

  -- If no IP restrictions configured, allow all
  IF v_allowed_ranges IS NULL OR jsonb_array_length(v_allowed_ranges) = 0 THEN
    RETURN true;
  END IF;

  -- Check if client IP is in allowed ranges
  v_is_allowed := false;
  FOR v_range IN SELECT jsonb_array_elements_text(v_allowed_ranges) LOOP
    IF v_client_ip <<= v_range::CIDR THEN
      v_is_allowed := true;
      EXIT;
    END IF;
  END LOOP;

  -- Log unauthorized IP access attempt
  IF NOT v_is_allowed THEN
    PERFORM public.log_admin_activity(
      'unauthorized_ip_access',
      'security',
      auth.uid(),
      jsonb_build_object(
        'client_ip', v_client_ip,
        'allowed_ranges', v_allowed_ranges
      )
    );
  END IF;

  RETURN v_is_allowed;
END;
$$;

-- Enhanced rate limiting with progressive penalties
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
  p_endpoint TEXT,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60,
  p_progressive_penalty BOOLEAN DEFAULT true
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ip_address INET := inet_client_addr();
  v_attempt_count INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
  v_penalty_minutes INTEGER;
BEGIN
  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limit_attempts
  WHERE (user_id = v_user_id OR ip_address = v_ip_address)
    AND endpoint = p_endpoint
    AND blocked_until > NOW()
  ORDER BY last_attempt_at DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Count recent attempts
  SELECT COALESCE(SUM(attempt_count), 0) INTO v_attempt_count
  FROM public.rate_limit_attempts
  WHERE (user_id = v_user_id OR ip_address = v_ip_address)
    AND endpoint = p_endpoint
    AND last_attempt_at >= NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Calculate progressive penalty
  IF p_progressive_penalty THEN
    v_penalty_minutes := LEAST(60 * POWER(2, v_attempt_count / p_max_attempts), 1440); -- Max 24 hours
  ELSE
    v_penalty_minutes := 60; -- Standard 1 hour
  END IF;
  
  -- If exceeded, block with progressive penalty
  IF v_attempt_count >= p_max_attempts THEN
    INSERT INTO public.rate_limit_attempts (user_id, ip_address, endpoint, attempt_count, blocked_until)
    VALUES (v_user_id, v_ip_address, p_endpoint, 1, NOW() + (v_penalty_minutes || ' minutes')::interval)
    ON CONFLICT (user_id, ip_address, endpoint) DO UPDATE SET
      attempt_count = rate_limit_attempts.attempt_count + 1,
      last_attempt_at = NOW(),
      blocked_until = NOW() + (v_penalty_minutes || ' minutes')::interval;
    
    -- Log rate limit exceeded
    PERFORM public.log_admin_activity(
      'rate_limit_exceeded',
      'security',
      v_user_id,
      jsonb_build_object(
        'endpoint', p_endpoint,
        'attempt_count', v_attempt_count,
        'penalty_minutes', v_penalty_minutes,
        'ip_address', v_ip_address
      )
    );
    
    RETURN false;
  END IF;
  
  -- Record attempt
  INSERT INTO public.rate_limit_attempts (user_id, ip_address, endpoint)
  VALUES (v_user_id, v_ip_address, p_endpoint)
  ON CONFLICT (user_id, ip_address, endpoint) DO UPDATE SET
    attempt_count = rate_limit_attempts.attempt_count + 1,
    last_attempt_at = NOW();
  
  RETURN true;
END;
$$;