-- Add admin_id column to withdrawal_requests if it doesn't exist
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Add processed_by and processed_at columns for tracking
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);

ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on withdrawal_requests
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Master admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view assigned withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update assigned withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Master admins can update all withdrawal requests" ON withdrawal_requests;

-- Allow admins to view withdrawal requests from users they created OR unassigned requests
CREATE POLICY "Admins can view their users withdrawal requests"
ON withdrawal_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid()) AND 
  (
    admin_id = auth.uid() OR 
    admin_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = withdrawal_requests.user_id 
      AND profiles.created_by = auth.uid()
    )
  )
);

-- Master admins can view all withdrawal requests
CREATE POLICY "Master admins can view all withdrawal requests"
ON withdrawal_requests
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid(), 'master_admin'));

-- Admins can update withdrawal requests for their users
CREATE POLICY "Admins can update their users withdrawal requests"
ON withdrawal_requests
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid()) AND 
  (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = withdrawal_requests.user_id 
      AND profiles.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  is_admin_user(auth.uid()) AND 
  (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = withdrawal_requests.user_id 
      AND profiles.created_by = auth.uid()
    )
  )
);

-- Master admins can update any withdrawal request
CREATE POLICY "Master admins can update all withdrawal requests"
ON withdrawal_requests
FOR UPDATE
TO authenticated
USING (has_admin_role(auth.uid(), 'master_admin'))
WITH CHECK (has_admin_role(auth.uid(), 'master_admin'));