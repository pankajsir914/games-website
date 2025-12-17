-- Script to assign existing users to a specific admin
-- Replace 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6' with the actual admin ID if different

-- Option 1: Assign all users with NULL created_by to current admin
-- UPDATE public.profiles 
-- SET created_by = 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid
-- WHERE created_by IS NULL;

-- Option 2: Assign all users (regardless of created_by) to current admin
-- WARNING: This will reassign ALL users to this admin
-- UPDATE public.profiles 
-- SET created_by = 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid
-- WHERE id IN (SELECT id FROM auth.users WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'master_admin')));

-- Option 3: Assign specific users by their IDs
-- UPDATE public.profiles 
-- SET created_by = 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid
-- WHERE id IN ('user-id-1', 'user-id-2', 'user-id-3');

-- Note: Uncomment the option you want to use and replace the admin ID if needed







