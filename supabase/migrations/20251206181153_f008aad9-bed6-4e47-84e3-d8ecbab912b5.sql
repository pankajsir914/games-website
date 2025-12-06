-- Add TPIN columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tpin_hash TEXT,
ADD COLUMN IF NOT EXISTS tpin_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tpin_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tpin_locked_until TIMESTAMPTZ;

-- Create function to set admin TPIN (securely hashed using pgcrypto)
CREATE OR REPLACE FUNCTION public.set_admin_tpin(p_tpin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_user_id 
    AND role IN ('admin', 'master_admin', 'moderator')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can set TPIN');
  END IF;
  
  -- Validate TPIN format (4-6 digits)
  IF p_tpin IS NULL OR LENGTH(p_tpin) < 4 OR LENGTH(p_tpin) > 6 OR p_tpin !~ '^[0-9]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'TPIN must be 4-6 digits');
  END IF;
  
  -- Update profile with hashed TPIN using crypt with blowfish
  UPDATE profiles 
  SET 
    tpin_hash = crypt(p_tpin, gen_salt('bf')),
    tpin_set_at = NOW(),
    tpin_failed_attempts = 0,
    tpin_locked_until = NULL
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create function to verify admin TPIN
CREATE OR REPLACE FUNCTION public.verify_admin_tpin(p_tpin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tpin_hash TEXT;
  v_failed_attempts INTEGER;
  v_locked_until TIMESTAMPTZ;
  v_is_valid BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get TPIN data
  SELECT tpin_hash, tpin_failed_attempts, tpin_locked_until
  INTO v_tpin_hash, v_failed_attempts, v_locked_until
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_tpin_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TPIN not set');
  END IF;
  
  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Account locked due to too many failed attempts',
      'locked_until', v_locked_until,
      'remaining_minutes', CEIL(EXTRACT(EPOCH FROM (v_locked_until - NOW())) / 60)
    );
  END IF;
  
  -- Verify TPIN
  v_is_valid := (v_tpin_hash = crypt(p_tpin, v_tpin_hash));
  
  IF v_is_valid THEN
    -- Reset failed attempts on success
    UPDATE profiles 
    SET tpin_failed_attempts = 0, tpin_locked_until = NULL
    WHERE id = v_user_id;
    
    -- Log successful verification
    INSERT INTO security_audit_logs (user_id, action, resource_type, response_status)
    VALUES (v_user_id, 'tpin_verify_success', 'admin_action', 200);
    
    RETURN jsonb_build_object('success', true);
  ELSE
    -- Increment failed attempts
    v_failed_attempts := COALESCE(v_failed_attempts, 0) + 1;
    
    -- Lock account after 5 failed attempts for 15 minutes
    IF v_failed_attempts >= 5 THEN
      UPDATE profiles 
      SET 
        tpin_failed_attempts = v_failed_attempts,
        tpin_locked_until = NOW() + INTERVAL '15 minutes'
      WHERE id = v_user_id;
      
      -- Log lockout
      INSERT INTO security_audit_logs (user_id, action, resource_type, response_status)
      VALUES (v_user_id, 'tpin_account_locked', 'admin_action', 403);
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Account locked for 15 minutes due to too many failed attempts',
        'locked', true,
        'remaining_attempts', 0
      );
    ELSE
      UPDATE profiles 
      SET tpin_failed_attempts = v_failed_attempts
      WHERE id = v_user_id;
      
      -- Log failed attempt
      INSERT INTO security_audit_logs (user_id, action, resource_type, response_status)
      VALUES (v_user_id, 'tpin_verify_failed', 'admin_action', 401);
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Invalid TPIN',
        'remaining_attempts', 5 - v_failed_attempts
      );
    END IF;
  END IF;
END;
$$;

-- Create function to check if admin has TPIN set
CREATE OR REPLACE FUNCTION public.check_admin_tpin_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tpin_hash TEXT;
  v_tpin_set_at TIMESTAMPTZ;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_user_id 
    AND role IN ('admin', 'master_admin', 'moderator')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', true, 'has_tpin', true, 'is_admin', false);
  END IF;
  
  -- Get TPIN status
  SELECT tpin_hash, tpin_set_at
  INTO v_tpin_hash, v_tpin_set_at
  FROM profiles
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'has_tpin', v_tpin_hash IS NOT NULL,
    'tpin_set_at', v_tpin_set_at,
    'is_admin', true
  );
END;
$$;

-- Create function for master admin to reset an admin's TPIN
CREATE OR REPLACE FUNCTION public.reset_admin_tpin(p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_master_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if current user is master admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_user_id 
    AND role = 'master_admin'
  ) INTO v_is_master_admin;
  
  IF NOT v_is_master_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only master admins can reset TPIN');
  END IF;
  
  -- Reset TPIN for target admin
  UPDATE profiles 
  SET 
    tpin_hash = NULL,
    tpin_set_at = NULL,
    tpin_failed_attempts = 0,
    tpin_locked_until = NULL
  WHERE id = p_admin_id;
  
  -- Log the reset
  INSERT INTO security_audit_logs (user_id, action, resource_type, resource_id, response_status)
  VALUES (v_user_id, 'tpin_reset_by_master', 'admin_action', p_admin_id, 200);
  
  RETURN jsonb_build_object('success', true);
END;
$$;