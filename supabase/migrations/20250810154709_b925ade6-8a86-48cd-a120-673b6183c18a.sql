-- Admin Credits: tables, policies, and functions

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.admin_credit_accounts (
  admin_id uuid PRIMARY KEY,
  balance numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  to_user_id uuid NULL,
  created_by uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  tx_type text NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) RLS and Policies
ALTER TABLE public.admin_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credit_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_credit_accounts' AND policyname = 'Admins and master admins can view admin credits'
  ) THEN
    CREATE POLICY "Admins and master admins can view admin credits"
    ON public.admin_credit_accounts
    FOR SELECT
    USING (
      admin_id = auth.uid() OR has_admin_role(auth.uid(), 'master_admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_credit_transactions' AND policyname = 'Admins and master admins can view admin credit transactions'
  ) THEN
    CREATE POLICY "Admins and master admins can view admin credit transactions"
    ON public.admin_credit_transactions
    FOR SELECT
    USING (
      admin_id = auth.uid() OR has_admin_role(auth.uid(), 'master_admin')
    );
  END IF;
END $$;

-- No direct INSERT/UPDATE/DELETE; managed via SECURITY DEFINER functions

-- 3) Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_credit_accounts_updated_at ON public.admin_credit_accounts;
CREATE TRIGGER trg_admin_credit_accounts_updated_at
BEFORE UPDATE ON public.admin_credit_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Functions

-- Allocate credits to an admin (master admin only)
CREATE OR REPLACE FUNCTION public.allocate_admin_credits(p_admin_id uuid, p_amount numeric, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance numeric(12,2);
BEGIN
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can allocate admin credits';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  INSERT INTO public.admin_credit_accounts (admin_id, balance)
  VALUES (p_admin_id, p_amount)
  ON CONFLICT (admin_id) DO UPDATE SET balance = public.admin_credit_accounts.balance + EXCLUDED.balance;

  INSERT INTO public.admin_credit_transactions (admin_id, to_user_id, created_by, amount, tx_type, notes)
  VALUES (p_admin_id, NULL, auth.uid(), p_amount, 'allocation', p_notes);

  PERFORM public.log_admin_activity(
    'allocate_admin_credits',
    'user',
    p_admin_id,
    jsonb_build_object('amount', p_amount, 'notes', p_notes)
  );

  SELECT balance INTO v_balance FROM public.admin_credit_accounts WHERE admin_id = p_admin_id;

  RETURN jsonb_build_object('success', true, 'admin_id', p_admin_id, 'new_balance', v_balance);
END;
$$;

-- Transfer credits from current admin to a user wallet
CREATE OR REPLACE FUNCTION public.transfer_admin_credits_to_user(p_user_id uuid, p_amount numeric, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account RECORD;
  v_new_balance numeric(12,2);
BEGIN
  IF NOT has_admin_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can transfer credits to users';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  SELECT * INTO v_account FROM public.admin_credit_accounts WHERE admin_id = auth.uid() FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit account found for this admin';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient admin credit balance';
  END IF;

  -- Deduct from admin credit account
  UPDATE public.admin_credit_accounts
  SET balance = balance - p_amount
  WHERE admin_id = auth.uid();

  -- Log transaction
  INSERT INTO public.admin_credit_transactions (admin_id, to_user_id, created_by, amount, tx_type, notes)
  VALUES (auth.uid(), p_user_id, auth.uid(), p_amount, 'distribution', p_notes);

  -- Credit user wallet (game_type NULL, session NULL)
  PERFORM public.update_wallet_balance(
    p_user_id,
    p_amount,
    'credit',
    COALESCE(p_notes, 'Admin points distribution'),
    NULL,
    NULL
  );

  -- Activity log
  PERFORM public.log_admin_activity(
    'transfer_admin_credits_to_user',
    'user',
    p_user_id,
    jsonb_build_object('amount', p_amount, 'from_admin', auth.uid(), 'notes', p_notes)
  );

  SELECT balance INTO v_new_balance FROM public.admin_credit_accounts WHERE admin_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'amount', p_amount, 'admin_new_balance', v_new_balance);
END;
$$;

-- Optional: get current admin credit balance
CREATE OR REPLACE FUNCTION public.get_admin_credit_balance(_admin_id uuid DEFAULT auth.uid())
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT balance FROM public.admin_credit_accounts WHERE admin_id = _admin_id), 0.00);
$$;