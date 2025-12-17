-- Add security question columns to profiles table for TPIN recovery
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tpin_security_question TEXT,
ADD COLUMN IF NOT EXISTS tpin_security_answer_hash TEXT;

-- Update set_admin_tpin function to include security question
CREATE OR REPLACE FUNCTION public.set_admin_tpin(
  p_tpin TEXT,
  p_security_question TEXT DEFAULT NULL,
  p_security_answer TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN := FALSE;
  v_tpin_hash TEXT;
  v_answer_hash TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id 
    AND role IN ('admin', 'moderator', 'master_admin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized - Admin access required');
  END IF;
  
  -- Validate TPIN
  IF p_tpin IS NULL OR LENGTH(p_tpin) < 4 OR LENGTH(p_tpin) > 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'TPIN must be 4-6 digits');
  END IF;
  
  -- Hash the TPIN using SHA256 with admin_id as salt
  v_tpin_hash := encode(sha256((v_admin_id::text || p_tpin)::bytea), 'hex');
  
  -- Hash security answer if provided (case-insensitive, trimmed)
  IF p_security_answer IS NOT NULL AND p_security_answer != '' THEN
    v_answer_hash := encode(sha256((v_admin_id::text || LOWER(TRIM(p_security_answer)))::bytea), 'hex');
  END IF;
  
  -- Update profile with TPIN and security question
  UPDATE public.profiles
  SET 
    tpin_hash = v_tpin_hash,
    tpin_set_at = NOW(),
    tpin_failed_attempts = 0,
    tpin_locked_until = NULL,
    tpin_security_question = COALESCE(p_security_question, tpin_security_question),
    tpin_security_answer_hash = COALESCE(v_answer_hash, tpin_security_answer_hash)
  WHERE id = v_admin_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Function to verify security question answer
CREATE OR REPLACE FUNCTION public.verify_tpin_security_answer(p_answer TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_admin_id UUID;
  v_stored_hash TEXT;
  v_answer_hash TEXT;
  v_is_valid BOOLEAN;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get stored security answer hash
  SELECT tpin_security_answer_hash
  INTO v_stored_hash
  FROM public.profiles
  WHERE id = v_admin_id;
  
  IF v_stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No security question set');
  END IF;
  
  -- Hash the provided answer (case-insensitive, trimmed)
  v_answer_hash := encode(sha256((v_admin_id::text || LOWER(TRIM(p_answer)))::bytea), 'hex');
  
  -- Compare hashes
  v_is_valid := (v_stored_hash = v_answer_hash);
  
  IF v_is_valid THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect answer');
  END IF;
END;
$function$;

-- Function to get security question for current user
CREATE OR REPLACE FUNCTION public.get_tpin_security_question()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_admin_id UUID;
  v_question TEXT;
  v_has_question BOOLEAN;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT tpin_security_question
  INTO v_question
  FROM public.profiles
  WHERE id = v_admin_id;
  
  v_has_question := (v_question IS NOT NULL AND v_question != '');
  
  RETURN jsonb_build_object(
    'success', true,
    'has_security_question', v_has_question,
    'security_question', v_question
  );
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_admin_tpin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_tpin_security_answer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tpin_security_question() TO authenticated;


