-- Fix remaining function security issues by adding SET search_path = 'public' to all functions

-- Update all existing functions to include proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_master_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT has_admin_role(_user_id, 'master_admin'::admin_role)
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_promotions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_teen_patti_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.allocate_admin_credits(p_admin_id uuid, p_amount numeric, p_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.transfer_admin_credits_to_user(p_user_id uuid, p_amount numeric, p_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_credit_balance(_admin_id uuid DEFAULT auth.uid())
RETURNS numeric
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE((SELECT balance FROM public.admin_credit_accounts WHERE admin_id = _admin_id), 0.00);
$function$;