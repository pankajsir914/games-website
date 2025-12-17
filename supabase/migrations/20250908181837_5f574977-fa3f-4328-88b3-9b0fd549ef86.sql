-- First, let's check the structure of user_roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- Check if current user has any role
SELECT 
    auth.uid() as current_user_id,
    ur.role,
    ur.assigned_by
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- If no role exists, assign admin role to current user for testing
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (auth.uid(), 'admin', auth.uid())
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the is_admin_user function works
SELECT public.is_admin_user(auth.uid()) as is_admin;