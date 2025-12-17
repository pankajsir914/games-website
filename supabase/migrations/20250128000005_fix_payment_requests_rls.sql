-- Fix payment_requests RLS policies to properly filter by created_by
-- This migration drops all conflicting policies and creates the correct one

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all possible conflicting policies for payment_requests
DROP POLICY IF EXISTS "Admins can view payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins view assigned payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins update assigned payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view their users payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update their users payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Master admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Master admins can update all payment requests" ON public.payment_requests;

-- Keep user policies but drop to recreate properly
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can update own payment requests" ON public.payment_requests;

-- ============================================
-- CREATE HELPER FUNCTION (if not exists)
-- ============================================

-- Create helper function to check if a user was created by an admin
-- This function runs with SECURITY DEFINER to bypass RLS on profiles table
CREATE OR REPLACE FUNCTION public.check_user_created_by(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = p_user_id 
    AND p.created_by = p_admin_id
  )
$$;

-- ============================================
-- CREATE CORRECT POLICIES
-- ============================================

-- 1. Users can view their own payment requests
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can create their own payment requests
CREATE POLICY "Users can create own payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own payment requests (only if pending)
CREATE POLICY "Users can update own payment requests"
ON public.payment_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 4. Admins can view payment requests from users they created OR master admin sees all
CREATE POLICY "Admins can view payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (
  -- User's own requests
  auth.uid() = user_id
  OR
  -- Master admin can see all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can see requests from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(payment_requests.user_id, auth.uid())
  )
  OR
  -- Admin can see requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- 5. Admins can update payment requests from users they created OR master admin can update all
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(payment_requests.user_id, auth.uid())
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
)
WITH CHECK (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(payment_requests.user_id, auth.uid())
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- ============================================
-- VERIFY NO OTHER POLICIES EXIST
-- ============================================

-- This will help identify if there are any other policies we missed
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'payment_requests'
    AND policyname NOT IN (
      'Users can view own payment requests',
      'Users can create own payment requests',
      'Users can update own payment requests',
      'Admins can view payment requests',
      'Admins can update payment requests'
    );
  
  IF policy_count > 0 THEN
    RAISE NOTICE 'Warning: Found % additional policies on payment_requests. Please review manually.', policy_count;
  END IF;
END $$;







