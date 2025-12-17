-- PHASE 1: Critical Data Exposure Fixes

-- 1. Restrict ludo_rooms access to participants only
DROP POLICY IF EXISTS "Users can view all ludo rooms" ON public.ludo_rooms;

CREATE POLICY "Users can view rooms they created or joined"
ON public.ludo_rooms
FOR SELECT
USING (
  auth.uid() = created_by OR 
  (auth.uid())::text = ANY(SELECT jsonb_array_elements_text(players->'user_ids'))
);

-- 2. Note: aviator_live_bets is a view, so we need to secure the underlying tables instead
-- This will be handled by securing aviator_bets table access

-- 3. Restrict aviator_chat_messages to recent messages only for privacy
DROP POLICY IF EXISTS "Authenticated users can view aviator chat messages" ON public.aviator_chat_messages;

CREATE POLICY "Users can view recent aviator chat messages"
ON public.aviator_chat_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  created_at >= NOW() - INTERVAL '1 hour'
);

-- 4. Restrict rummy_sessions access to participants only  
DROP POLICY IF EXISTS "Users can view all rummy sessions" ON public.rummy_sessions;

CREATE POLICY "Users can view sessions they created or joined"
ON public.rummy_sessions
FOR SELECT
USING (
  auth.uid() = created_by OR 
  (auth.uid())::text = ANY(SELECT jsonb_array_elements_text(players->'user_ids'))
);

-- PHASE 2: Database Security Hardening

-- 5. Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(
  p_input text,
  p_max_length integer DEFAULT 255,
  p_allow_html boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_sanitized text;
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
  
  -- Remove HTML tags if not allowed
  IF NOT p_allow_html THEN
    v_sanitized := regexp_replace(v_sanitized, '<[^>]*>', '', 'gi');
  END IF;
  
  -- Remove potentially dangerous content
  v_sanitized := regexp_replace(v_sanitized, '(script|javascript|vbscript|onload|onerror|onclick|eval|expression)', '', 'gi');
  
  -- Remove SQL injection patterns
  v_sanitized := regexp_replace(v_sanitized, '(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)', '', 'gi');
  
  RETURN v_sanitized;
END;
$function$;

-- 6. Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address inet,
  endpoint text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamp with time zone DEFAULT NOW(),
  last_attempt_at timestamp with time zone DEFAULT NOW(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW()
);

ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all rate limit attempts"
ON public.rate_limit_attempts
FOR SELECT
USING (is_admin_user(auth.uid()));

-- 7. Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_endpoint text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_ip_address inet := inet_client_addr();
  v_attempt_count integer;
  v_blocked_until timestamp with time zone;
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
  
  -- If exceeded, block for 1 hour
  IF v_attempt_count >= p_max_attempts THEN
    INSERT INTO public.rate_limit_attempts (user_id, ip_address, endpoint, attempt_count, blocked_until)
    VALUES (v_user_id, v_ip_address, p_endpoint, 1, NOW() + INTERVAL '1 hour')
    ON CONFLICT (user_id, ip_address, endpoint) DO UPDATE SET
      attempt_count = rate_limit_attempts.attempt_count + 1,
      last_attempt_at = NOW(),
      blocked_until = NOW() + INTERVAL '1 hour';
    
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
$function$;