-- Fix the create_user_simple function to properly handle user creation
CREATE OR REPLACE FUNCTION public.create_user_simple(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL::text,
  p_user_type text DEFAULT 'user'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_role text;
  v_result jsonb;
BEGIN
  -- Get caller's role
  SELECT public.get_user_highest_role(auth.uid()) INTO v_caller_role;
  
  -- Check permissions
  IF v_caller_role NOT IN ('admin', 'master_admin') THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;
  
  -- Only master admin can create admin users
  IF p_user_type = 'admin' AND v_caller_role != 'master_admin' THEN
    RAISE EXCEPTION 'Only master admins can create admin users';
  END IF;

  -- Validate inputs
  IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF p_password IS NULL OR LENGTH(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  
  IF p_full_name IS NULL OR LENGTH(TRIM(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  -- Call the create-user edge function to create user in auth
  SELECT status, content
  INTO v_result
  FROM http((
    'POST',
    'https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/create-user',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token')
    ],
    'application/json',
    jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'fullName', p_full_name,
      'phone', p_phone,
      'userType', p_user_type
    )::text
  ));

  -- If edge function call fails, return error
  IF v_result->>'success' != 'true' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(v_result->>'error', 'Failed to create user account')
    );
  END IF;
  
  -- Log activity
  PERFORM public.log_admin_activity(
    CASE WHEN p_user_type = 'admin' THEN 'create_admin_user' ELSE 'create_user' END,
    'user',
    (v_result->>'user_id')::uuid,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_full_name,
      'user_type', p_user_type,
      'created_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_result->>'user_id',
    'email', p_email,
    'user_type', p_user_type,
    'message', CASE WHEN p_user_type = 'admin' THEN 'Admin created successfully' ELSE 'User created successfully' END
  );
  
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;