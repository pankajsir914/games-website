
-- Create payment requests table for manual payment processing
CREATE TABLE public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT DEFAULT 'upi',
  receipt_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  bank_account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on payment_requests table
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment requests" ON public.payment_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS on withdrawal_requests table
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to process payment requests
CREATE OR REPLACE FUNCTION public.process_payment_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_result JSONB;
BEGIN
  -- Get payment request
  SELECT * INTO v_request
  FROM public.payment_requests
  WHERE id = p_request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Payment request already processed';
  END IF;
  
  -- Update payment request status
  UPDATE public.payment_requests
  SET status = p_status,
      admin_notes = p_admin_notes,
      processed_by = auth.uid(),
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;
  
  -- If approved, add balance to wallet
  IF p_status = 'approved' THEN
    SELECT public.update_wallet_balance(
      v_request.user_id,
      v_request.amount,
      'credit',
      'Payment approved - Request ID: ' || p_request_id::text
    ) INTO v_result;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'amount', v_request.amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process withdrawal requests
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get withdrawal request
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
  
  -- Update withdrawal request status
  UPDATE public.withdrawal_requests
  SET status = p_status,
      admin_notes = p_admin_notes,
      processed_by = auth.uid(),
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'amount', v_request.amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
