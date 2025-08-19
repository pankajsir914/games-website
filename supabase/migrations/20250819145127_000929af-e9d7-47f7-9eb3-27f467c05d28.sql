-- Update create_user_simple to use proper HTTP extension
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
  v_status int;
  v_headers text;
  v_content text;
  v_json jsonb;
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

  -- Call the create-user edge function using http extension
  SELECT status, headers::text, content
  INTO v_status, v_headers, v_content
  FROM extensions.http_post(
    url := 'https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/create-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT auth.jwt())
    ),
    body := jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'fullName', p_full_name,
      'phone', p_phone,
      'userType', p_user_type
    )::text
  );

  -- Parse JSON safely
  BEGIN
    v_json := v_content::jsonb;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', v_status,
      'error', COALESCE(v_content, 'Edge function did not return valid JSON')
    );
  END;

  -- Return the response from edge function
  RETURN v_json;
  
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;