
-- Drop existing admin SELECT policy for withdrawal_requests
DROP POLICY IF EXISTS "Admins can view their users withdrawal requests" ON public.withdrawal_requests;

-- Create a simpler and more reliable policy for admins
CREATE POLICY "Admins can view their users withdrawal requests" 
ON public.withdrawal_requests
FOR SELECT 
USING (
  -- User's own requests
  auth.uid() = user_id
  OR
  -- Master admin can see all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can see requests from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = withdrawal_requests.user_id 
      AND p.created_by = auth.uid()
    )
  )
  OR
  -- Admin can see requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
  OR
  -- Admin can see unassigned requests from their users
  (is_admin_user(auth.uid()) AND admin_id IS NULL AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = withdrawal_requests.user_id 
    AND p.created_by = auth.uid()
  ))
);

-- Drop existing admin UPDATE policy
DROP POLICY IF EXISTS "Admins can update their users withdrawal requests" ON public.withdrawal_requests;

-- Create a simpler UPDATE policy for admins
CREATE POLICY "Admins can update their users withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = withdrawal_requests.user_id 
      AND p.created_by = auth.uid()
    )
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- Drop and recreate the Users SELECT policy to avoid conflicts
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Drop the master admin policy as it's now included in the main admin policy
DROP POLICY IF EXISTS "Master admins can view all withdrawal requests" ON public.withdrawal_requests;
