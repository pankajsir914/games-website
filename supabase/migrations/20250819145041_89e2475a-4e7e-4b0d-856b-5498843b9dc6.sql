-- Update create_user_simple to handle HTTP call properly and work directly with edge function
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
  v_response http_response;
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

  -- Make HTTP request to edge function
  SELECT * FROM http_post(
    'https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/create-user',
    jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'fullName', p_full_name,
      'phone', p_phone,
      'userType', p_user_type
    )::text,
    'application/json',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || coalesce(
        current_setting('request.jwt.claims', true)::json->>'token',
        current_setting('request.jwt.token', true),
        (select auth.jwt())
      ))
    ]
  ) INTO v_response;

  -- Parse and return response
  IF v_response.status >= 400 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE((v_response.content::jsonb)->>'error', 'Request failed with status ' || v_response.status),
      'status', v_response.status
    );
  END IF;

  -- Return the parsed JSON response
  RETURN v_response.content::jsonb;
  
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;