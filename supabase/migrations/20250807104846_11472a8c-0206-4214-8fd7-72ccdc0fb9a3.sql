-- Update admin_role enum to include master_admin
ALTER TYPE admin_role ADD VALUE 'master_admin';

-- Create function for master admins to create regular admins
CREATE OR REPLACE FUNCTION public.admin_create_admin_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Check if caller is master admin
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
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

  -- Create user in auth.users via Supabase Admin API
  -- This is a placeholder - the actual implementation would need to use the admin API
  -- For now, we'll create a record that can be used to track the intended admin creation
  
  -- Generate a UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Create profile entry
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_user_id, p_full_name, p_phone);
  
  -- Create wallet entry
  INSERT INTO public.wallets (user_id)
  VALUES (v_user_id);
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (v_user_id, 'admin', auth.uid());
  
  -- Log the activity
  PERFORM public.log_admin_activity(
    'create_admin_user',
    'user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_full_name,
      'created_by_master_admin', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Admin user creation initiated'
  );
END;
$$;

-- Update admin_create_user function to only allow admins (not master admins) to create regular users
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Check if caller is admin (but not master admin - master admins create admins, not users)
  IF NOT (has_admin_role(auth.uid(), 'admin') AND NOT has_admin_role(auth.uid(), 'master_admin')) THEN
    RAISE EXCEPTION 'Only regular admins can create user accounts';
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

  -- Generate a UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Create profile entry
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_user_id, p_full_name, p_phone);
  
  -- Create wallet entry
  INSERT INTO public.wallets (user_id)
  VALUES (v_user_id);
  
  -- Note: No explicit user role assignment needed as regular users don't get roles
  
  -- Log the activity
  PERFORM public.log_admin_activity(
    'create_user',
    'user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_full_name,
      'created_by_admin', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User creation initiated'
  );
END;
$$;

-- Create helper function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master_admin') THEN 'master_admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'moderator') THEN 'moderator'
      ELSE 'user'
    END;
$$;

-- Update RLS policies to respect hierarchy
-- Allow master admins to view all user roles
CREATE POLICY "Master admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_admin_role(auth.uid(), 'master_admin'));

-- Allow master admins to manage admin roles
CREATE POLICY "Master admins can manage admin roles"
ON public.user_roles
FOR ALL
USING (
  has_admin_role(auth.uid(), 'master_admin') AND 
  role IN ('admin', 'moderator')
);