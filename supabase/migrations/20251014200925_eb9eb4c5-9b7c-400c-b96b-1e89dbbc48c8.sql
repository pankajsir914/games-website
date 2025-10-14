-- Fix process_withdrawal_request to use NULL category for withdrawals
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(p_request_id uuid, p_status text, p_admin_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request RECORD;
  v_wallet_result JSONB;
BEGIN
  -- Validate status
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved or rejected';
  END IF;

  -- Get withdrawal request with lock
  SELECT * INTO v_request
  FROM public.withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request already processed';
  END IF;
  
  -- If approved, deduct money from user wallet
  IF p_status = 'approved' THEN
    -- Call update_wallet_balance to deduct the amount with NULL category
    SELECT public.update_wallet_balance(
      v_request.user_id,
      v_request.amount,
      'debit',
      'Withdrawal approved - Request ID: ' || p_request_id::TEXT,
      NULL,  -- Changed from 'withdrawal' to NULL
      p_request_id
    ) INTO v_wallet_result;
    
    -- Check if wallet update was successful
    IF (v_wallet_result->>'success')::BOOLEAN != true THEN
      RAISE EXCEPTION 'Failed to deduct amount from wallet';
    END IF;
  END IF;
  
  -- Update withdrawal request status
  UPDATE public.withdrawal_requests
  SET 
    status = p_status,
    admin_notes = p_admin_notes,
    processed_by = auth.uid(),
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'amount', v_request.amount,
    'user_id', v_request.user_id,
    'new_balance', CASE 
      WHEN p_status = 'approved' THEN v_wallet_result->>'new_balance'
      ELSE NULL
    END
  );
END;
$function$;