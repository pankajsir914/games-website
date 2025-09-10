-- Secure admin_credit_transactions by enabling RLS and adding least-privilege policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'admin_credit_transactions'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.admin_credit_transactions ENABLE ROW LEVEL SECURITY';

    -- Drop old policies if they exist to avoid duplicates
    EXECUTE 'DROP POLICY IF EXISTS "Master admins can view all admin credit transactions" ON public.admin_credit_transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view own admin credit transactions" ON public.admin_credit_transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert admin credit transactions" ON public.admin_credit_transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Master admins can update admin credit transactions" ON public.admin_credit_transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Master admins can delete admin credit transactions" ON public.admin_credit_transactions';

    -- Read policies
    EXECUTE $$
      CREATE POLICY "Master admins can view all admin credit transactions"
      ON public.admin_credit_transactions
      FOR SELECT
      USING (has_admin_role(auth.uid(), 'master_admin'::admin_role));
    $$;

    EXECUTE $$
      CREATE POLICY "Admins can view own admin credit transactions"
      ON public.admin_credit_transactions
      FOR SELECT
      USING (
        is_admin_user(auth.uid())
        AND (admin_id = auth.uid() OR created_by = auth.uid())
      );
    $$;

    -- Insert policy (allow admins; constrain to rows they create/own)
    EXECUTE $$
      CREATE POLICY "Admins can insert admin credit transactions"
      ON public.admin_credit_transactions
      FOR INSERT
      WITH CHECK (
        is_admin_user(auth.uid())
        AND (admin_id = auth.uid() OR created_by = auth.uid())
      );
    $$;

    -- Update/Delete reserved for master admins
    EXECUTE $$
      CREATE POLICY "Master admins can update admin credit transactions"
      ON public.admin_credit_transactions
      FOR UPDATE
      USING (has_admin_role(auth.uid(), 'master_admin'::admin_role))
      WITH CHECK (has_admin_role(auth.uid(), 'master_admin'::admin_role));
    $$;

    EXECUTE $$
      CREATE POLICY "Master admins can delete admin credit transactions"
      ON public.admin_credit_transactions
      FOR DELETE
      USING (has_admin_role(auth.uid(), 'master_admin'::admin_role));
    $$;
  END IF;
END$$;