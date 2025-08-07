-- Fix master admin authentication issues

-- First, let's remove the incorrectly inserted auth.users record
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Remove the related records that might cause issues
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.wallets WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Add RLS policy to allow master admins to read user_roles
CREATE POLICY "Master admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_admin_role(auth.uid(), 'master_admin'));

-- Create a function to set up master admin after user creation
CREATE OR REPLACE FUNCTION public.setup_master_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Assign master_admin role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, 'master_admin', target_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile if exists
  UPDATE public.profiles 
  SET full_name = COALESCE(full_name, 'Master Administrator')
  WHERE id = target_user_id;
  
  -- Ensure wallet exists with good balance
  INSERT INTO public.wallets (user_id, current_balance)
  VALUES (target_user_id, 1000000.00)
  ON CONFLICT (user_id) DO UPDATE SET current_balance = 1000000.00;
END;
$$;