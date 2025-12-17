-- Fix JSON cast error in admin_create_user by treating headers as text
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status int;
  v_headers text; -- treat headers as text to avoid json cast issues
  v_content text;
BEGIN
  -- Allow both admins and master admins to create regular users
  IF NOT (has_admin_role(auth.uid(), 'admin') OR has_admin_role(auth.uid(), 'master_admin')) THEN
    RAISE EXCEPTION 'Only admins can create users';
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

  -- Call the create-user edge function
  SELECT status, headers::text, content
  INTO v_status, v_headers, v_content
  FROM public.extensions.http_post(
    url := 'https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/create-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT auth.jwt())
    ),
    body := jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'fullName', p_full_name,
      'phone', p_phone
    )::text
  );

  -- Try to return parsed JSON; if it fails, wrap safely
  BEGIN
    RETURN v_content::jsonb;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', v_status,
      'error', COALESCE(v_content, 'Edge function did not return JSON')
    );
  END;
END;
$function$;