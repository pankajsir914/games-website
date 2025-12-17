-- Fix TPIN functions to use SHA256 instead of bcrypt (pgcrypto gen_salt not available)

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS public.set_admin_tpin(text);
DROP FUNCTION IF EXISTS public.verify_admin_tpin(text);

-- Recreate set_admin_tpin using SHA256 hashing
CREATE OR REPLACE FUNCTION public.set_admin_tpin(p_tpin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_tpin_hash TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id AND role IN ('admin', 'master_admin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can set TPIN');
  END IF;
  
  -- Validate TPIN format (4-6 digits)
  IF p_tpin IS NULL OR LENGTH(p_tpin) < 4 OR LENGTH(p_tpin) > 6 OR p_tpin !~ '^[0-9]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'TPIN must be 4-6 digits');
  END IF;
  
  -- Hash the TPIN using SHA256 with user ID as salt
  v_tpin_hash := encode(sha256((v_admin_id::text || p_tpin)::bytea), 'hex');
  
  -- Update profile with TPIN
  UPDATE public.profiles
  SET 
    tpin_hash = v_tpin_hash,
    tpin_set_at = NOW(),
    tpin_failed_attempts = 0,
    tpin_locked_until = NULL
  WHERE id = v_admin_id;
  
  -- Log the activity
  PERFORM public.log_admin_activity(
    'tpin_set',
    'security',
    v_admin_id,
    jsonb_build_object('action', 'TPIN set successfully')
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'TPIN set successfully');
END;
$$;

-- Recreate verify_admin_tpin using SHA256 hashing
CREATE OR REPLACE FUNCTION public.verify_admin_tpin(p_tpin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_stored_hash TEXT;
  v_input_hash TEXT;
  v_failed_attempts INT;
  v_locked_until TIMESTAMPTZ;
  v_remaining_attempts INT;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current TPIN data
  SELECT tpin_hash, tpin_failed_attempts, tpin_locked_until
  INTO v_stored_hash, v_failed_attempts, v_locked_until
  FROM public.profiles
  WHERE id = v_admin_id;
  
  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Account locked. Try again later.',
      'locked', true,
      'locked_until', v_locked_until,
      'remaining_minutes', CEIL(EXTRACT(EPOCH FROM (v_locked_until - NOW())) / 60)
    );
  END IF;
  
  -- Check if TPIN is set
  IF v_stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TPIN not set');
  END IF;
  
  -- Hash the input TPIN with user ID as salt
  v_input_hash := encode(sha256((v_admin_id::text || p_tpin)::bytea), 'hex');
  
  -- Verify TPIN
  IF v_input_hash = v_stored_hash THEN
    -- Reset failed attempts on success
    UPDATE public.profiles
    SET tpin_failed_attempts = 0, tpin_locked_until = NULL
    WHERE id = v_admin_id;
    
    -- Log successful verification
    PERFORM public.log_admin_activity(
      'tpin_verify_success',
      'security',
      v_admin_id,
      jsonb_build_object('action', 'TPIN verified successfully')
    );
    
    RETURN jsonb_build_object('success', true);
  ELSE
    -- Increment failed attempts
    v_failed_attempts := COALESCE(v_failed_attempts, 0) + 1;
    v_remaining_attempts := 5 - v_failed_attempts;
    
    IF v_failed_attempts >= 5 THEN
      -- Lock account for 15 minutes
      UPDATE public.profiles
      SET 
        tpin_failed_attempts = v_failed_attempts,
        tpin_locked_until = NOW() + INTERVAL '15 minutes'
      WHERE id = v_admin_id;
      
      -- Log lockout
      PERFORM public.log_admin_activity(
        'tpin_lockout',
        'security',
        v_admin_id,
        jsonb_build_object('action', 'Account locked due to failed TPIN attempts')
      );
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Too many failed attempts. Account locked for 15 minutes.',
        'locked', true,
        'locked_until', NOW() + INTERVAL '15 minutes',
        'remaining_minutes', 15
      );
    ELSE
      UPDATE public.profiles
      SET tpin_failed_attempts = v_failed_attempts
      WHERE id = v_admin_id;
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Invalid TPIN',
        'remaining_attempts', v_remaining_attempts
      );
    END IF;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_admin_tpin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_tpin(text) TO authenticated;