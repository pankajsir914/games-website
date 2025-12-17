-- Fix RLS policies to use SECURITY DEFINER function for checking created_by
-- This bypasses profiles table RLS restrictions when checking created_by in EXISTS subqueries

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

-- Now update RLS policies to use this function instead of direct EXISTS subquery

-- ============================================
-- PAYMENT_REQUESTS POLICIES
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view payment requests" ON public.payment_requests;

-- Create updated SELECT policy using the helper function
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

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;

-- Create updated UPDATE policy using the helper function
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
-- WITHDRAWAL_REQUESTS POLICIES
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view their users withdrawal requests" ON public.withdrawal_requests;

-- Create updated SELECT policy using the helper function
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
  -- Admin can see requests from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(withdrawal_requests.user_id, auth.uid())
  )
  OR
  -- Admin can see requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- Drop existing UPDATE policy if exists
DROP POLICY IF EXISTS "Admins can update their users withdrawal requests" ON public.withdrawal_requests;

-- Create updated UPDATE policy using the helper function
CREATE POLICY "Admins can update their users withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(withdrawal_requests.user_id, auth.uid())
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
    AND public.check_user_created_by(withdrawal_requests.user_id, auth.uid())
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- ============================================
-- WALLET_TRANSACTIONS POLICIES
-- ============================================

-- Drop existing policies (drop all possible variations to ensure clean state)
DROP POLICY IF EXISTS "Admins can view transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view only their users' transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;

-- Recreate user policy first (if it doesn't exist from other migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'wallet_transactions' 
    AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated SELECT policy using the helper function
CREATE POLICY "Admins can view transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (
  -- User's own transactions
  auth.uid() = user_id
  OR
  -- Master admin can see all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can see transactions from users they created (using helper function)
  (
    is_admin_user(auth.uid()) 
    AND public.check_user_created_by(wallet_transactions.user_id, auth.uid())
  )
);

