-- Simple user creation function - admin can create users, master admin can create admins
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
  v_user_id uuid;
  v_caller_role text;
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

  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone, created_by)
  VALUES (v_user_id, p_full_name, p_phone, auth.uid());
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, current_balance)
  VALUES (v_user_id, 0.00);
  
  -- Assign role (default is 'user', no role entry needed)
  IF p_user_type = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (v_user_id, 'admin', auth.uid());
  END IF;
  
  -- Log activity
  PERFORM public.log_admin_activity(
    CASE WHEN p_user_type = 'admin' THEN 'create_admin_user' ELSE 'create_user' END,
    'user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_full_name,
      'user_type', p_user_type,
      'created_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
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