-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}'::JSONB,
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Function to enforce single device login
CREATE OR REPLACE FUNCTION public.enforce_single_device_login(
  p_user_id UUID,
  p_session_token TEXT,
  p_device_info JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invalidated_count INTEGER;
BEGIN
  -- First, deactivate all existing sessions for this user
  UPDATE user_sessions
  SET is_active = false,
      expires_at = NOW()
  WHERE user_id = p_user_id
    AND is_active = true
    AND session_token != p_session_token;
  
  GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;
  
  -- Insert or update the new session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    device_info,
    user_agent,
    is_active,
    last_activity,
    expires_at
  ) VALUES (
    p_user_id,
    p_session_token,
    COALESCE(p_device_info, '{}'::JSONB),
    COALESCE(p_device_info->>'userAgent', 'Unknown'),
    true,
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (session_token) 
  DO UPDATE SET
    is_active = true,
    last_activity = NOW(),
    expires_at = NOW() + INTERVAL '7 days',
    device_info = COALESCE(EXCLUDED.device_info, user_sessions.device_info);
  
  -- Log the enforcement
  INSERT INTO security_audit_logs (
    user_id,
    action,
    resource_type,
    request_data
  ) VALUES (
    p_user_id,
    'single_session_enforced',
    'session',
    jsonb_build_object(
      'invalidated_sessions', v_invalidated_count,
      'device_info', p_device_info
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invalidated_sessions', v_invalidated_count,
    'message', format('Logged out from %s other device(s)', v_invalidated_count)
  );
END;
$$;

-- Function to check if current session is valid
CREATE OR REPLACE FUNCTION public.is_session_valid(
  p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_sessions
    WHERE session_token = p_session_token
      AND is_active = true
      AND expires_at > NOW()
  ) INTO v_valid;
  
  RETURN COALESCE(v_valid, false);
END;
$$;