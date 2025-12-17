-- Create admin function to manually create users
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;
  
  -- Validate input
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF p_password IS NULL OR LENGTH(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;
  
  -- Generate new user ID
  v_user_id := gen_random_uuid();
  
  -- Insert into auth.users (this bypasses normal signup flow)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_user_id, p_full_name, p_phone);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (v_user_id);
  
  -- Log admin activity
  PERFORM public.log_admin_activity(
    'user_created',
    'user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_full_name,
      'created_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'message', 'User created successfully'
  );
END;
$function$;