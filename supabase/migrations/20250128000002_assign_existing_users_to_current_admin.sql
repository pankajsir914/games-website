-- Assign existing users to current admin
-- This will update all users (except admins) to be assigned to the admin with ID: d1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6
-- Replace the admin ID below with your actual admin ID if different

-- Update all regular users (not admins) to be created by this admin
UPDATE public.profiles 
SET created_by = 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid
WHERE id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'master_admin')
)
AND (
  created_by IS NULL 
  OR created_by != 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid
);

-- Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_by = 'd1369e8c-9ce2-4d75-8dc8-33f44ba4d3f6'::uuid THEN 1 END) as assigned_to_admin,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by
FROM public.profiles
WHERE id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'master_admin')
);







