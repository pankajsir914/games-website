-- Fix wallet_transactions RLS policies to properly filter by created_by
-- This migration drops all conflicting policies and creates the correct one

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all possible conflicting policies for wallet_transactions
-- Note: We need to drop policies that might allow all admins to see all transactions
DROP POLICY IF EXISTS "Admins can view transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view only their users' transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Master admins can view all transactions" ON public.wallet_transactions;

-- Also drop the FOR ALL policy that might be too permissive
-- This policy allows master admins to do everything, but we want more granular control
-- We'll recreate it with proper SELECT-only policy

-- Keep the user policy (users should see their own transactions)
-- But drop it first to recreate it properly
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;

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

-- 1. Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Admins can view transactions from users they created OR master admin sees all
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
    AND tablename = 'wallet_transactions'
    AND policyname NOT IN (
      'Users can view own transactions',
      'Admins can view transactions',
      'Users can insert own transactions'
    );
  
  IF policy_count > 0 THEN
    RAISE NOTICE 'Warning: Found % additional policies on wallet_transactions. Please review manually.', policy_count;
  END IF;
END $$;

