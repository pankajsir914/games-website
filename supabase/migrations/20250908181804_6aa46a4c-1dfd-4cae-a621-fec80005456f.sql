-- Check if the current user has admin role
SELECT 
    auth.uid() as current_user_id,
    ur.role,
    ur.assigned_by,
    ur.created_at
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- Also check if the is_admin_user function works correctly
SELECT public.is_admin_user(auth.uid()) as is_admin;