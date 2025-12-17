-- Create table for user betting limits
CREATE TABLE IF NOT EXISTS public.user_betting_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_bet_amount NUMERIC(12,2) NOT NULL DEFAULT 10000.00,
  daily_limit NUMERIC(12,2) DEFAULT 50000.00,
  weekly_limit NUMERIC(12,2) DEFAULT 200000.00,
  monthly_limit NUMERIC(12,2) DEFAULT 500000.00,
  is_custom BOOLEAN DEFAULT false, -- Whether this is a custom limit for specific user
  applied_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create global betting limits table
CREATE TABLE IF NOT EXISTS public.global_betting_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  limit_type TEXT NOT NULL UNIQUE, -- 'default', 'vip', 'new_user'
  max_single_bet NUMERIC(12,2) NOT NULL DEFAULT 5000.00,
  daily_limit NUMERIC(12,2) DEFAULT 20000.00,
  weekly_limit NUMERIC(12,2) DEFAULT 100000.00,
  monthly_limit NUMERIC(12,2) DEFAULT 300000.00,
  min_bet_amount NUMERIC(12,2) DEFAULT 10.00,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global limits
INSERT INTO public.global_betting_limits (limit_type, max_single_bet, daily_limit, weekly_limit, monthly_limit)
VALUES 
  ('default', 5000.00, 20000.00, 100000.00, 300000.00),
  ('vip', 25000.00, 100000.00, 500000.00, 1500000.00),
  ('new_user', 1000.00, 5000.00, 20000.00, 50000.00)
ON CONFLICT (limit_type) DO NOTHING;

-- Add indexes
CREATE INDEX idx_user_betting_limits_user_id ON public.user_betting_limits(user_id);
CREATE INDEX idx_global_betting_limits_type ON public.global_betting_limits(limit_type);

-- Enable RLS
ALTER TABLE public.user_betting_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_betting_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_betting_limits
CREATE POLICY "Admins can manage user betting limits" ON public.user_betting_limits
  FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can view their own limits" ON public.user_betting_limits
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for global_betting_limits
CREATE POLICY "Anyone can view global limits" ON public.global_betting_limits
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage global limits" ON public.global_betting_limits
  FOR ALL USING (is_admin_user(auth.uid()));

-- Function to get user's effective bet limits
CREATE OR REPLACE FUNCTION public.get_user_bet_limits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_limits JSONB;
BEGIN
  -- Check for custom user limits first
  SELECT jsonb_build_object(
    'max_bet_amount', max_bet_amount,
    'daily_limit', daily_limit,
    'weekly_limit', weekly_limit,
    'monthly_limit', monthly_limit,
    'is_custom', true
  ) INTO v_limits
  FROM user_betting_limits
  WHERE user_id = p_user_id;

  -- If no custom limits, use default
  IF v_limits IS NULL THEN
    SELECT jsonb_build_object(
      'max_bet_amount', max_single_bet,
      'daily_limit', daily_limit,
      'weekly_limit', weekly_limit,
      'monthly_limit', monthly_limit,
      'is_custom', false
    ) INTO v_limits
    FROM global_betting_limits
    WHERE limit_type = 'default';
  END IF;

  RETURN v_limits;
END;
$function$;

-- Function to set user bet limits
CREATE OR REPLACE FUNCTION public.set_user_bet_limits(
  p_user_id UUID,
  p_max_bet NUMERIC,
  p_daily_limit NUMERIC DEFAULT NULL,
  p_weekly_limit NUMERIC DEFAULT NULL,
  p_monthly_limit NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only admins can set limits
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can set user bet limits';
  END IF;

  INSERT INTO user_betting_limits (
    user_id,
    max_bet_amount,
    daily_limit,
    weekly_limit,
    monthly_limit,
    is_custom,
    applied_by,
    reason
  ) VALUES (
    p_user_id,
    p_max_bet,
    COALESCE(p_daily_limit, p_max_bet * 10),
    COALESCE(p_weekly_limit, p_max_bet * 40),
    COALESCE(p_monthly_limit, p_max_bet * 100),
    true,
    auth.uid(),
    p_reason
  )
  ON CONFLICT (user_id) DO UPDATE SET
    max_bet_amount = EXCLUDED.max_bet_amount,
    daily_limit = EXCLUDED.daily_limit,
    weekly_limit = EXCLUDED.weekly_limit,
    monthly_limit = EXCLUDED.monthly_limit,
    is_custom = true,
    applied_by = EXCLUDED.applied_by,
    reason = EXCLUDED.reason,
    updated_at = NOW();

  -- Log the activity
  PERFORM log_admin_activity(
    'set_user_bet_limits',
    'user',
    p_user_id,
    jsonb_build_object(
      'max_bet', p_max_bet,
      'daily_limit', p_daily_limit,
      'weekly_limit', p_weekly_limit,
      'monthly_limit', p_monthly_limit,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'limits_applied', true
  );
END;
$function$;