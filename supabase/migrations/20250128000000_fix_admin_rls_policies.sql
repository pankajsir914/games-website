-- Fix RLS policies for payment_requests, withdrawal_requests, and wallet_transactions
-- to allow admins to see data from their created users only
--
-- If you get an error about policy already existing, run these commands manually first:
-- DROP POLICY IF EXISTS "Admins can view payment requests" ON public.payment_requests;
-- DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
-- DROP POLICY IF EXISTS "Admins can view transactions" ON public.wallet_transactions;

-- ============================================
-- PAYMENT_REQUESTS POLICIES
-- ============================================

-- Drop existing admin policies (drop all possible variations to ensure clean state)
-- Note: Run these DROP statements first if migration fails due to existing policies
DROP POLICY IF EXISTS "Admins view assigned payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins update assigned payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view their users payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update their users payment requests" ON public.payment_requests;

-- Create comprehensive SELECT policy for payment_requests
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
  -- Admin can see requests from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = payment_requests.user_id 
      AND p.created_by = auth.uid()
    )
  )
  OR
  -- Admin can see requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- Create comprehensive UPDATE policy for payment_requests
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = payment_requests.user_id 
      AND p.created_by = auth.uid()
    )
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
)
WITH CHECK (
  -- Master admin can update all
  has_admin_role(auth.uid(), 'master_admin')
  OR
  -- Admin can update requests from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = payment_requests.user_id 
      AND p.created_by = auth.uid()
    )
  )
  OR
  -- Admin can update requests assigned to them
  (is_admin_user(auth.uid()) AND admin_id = auth.uid())
);

-- ============================================
-- WALLET_TRANSACTIONS POLICIES
-- ============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view transactions" ON public.wallet_transactions;

-- Create comprehensive SELECT policy for wallet_transactions
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
  -- Admin can see transactions from users they created
  (
    is_admin_user(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = wallet_transactions.user_id 
      AND p.created_by = auth.uid()
    )
  )
);

-- ============================================
-- WITHDRAWAL_REQUESTS POLICIES (Already fixed, but ensure consistency)
-- ============================================

-- Ensure withdrawal_requests policy allows unassigned requests
DROP POLICY IF EXISTS "Admins can view their users withdrawal requests" ON public.withdrawal_requests;

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
);

