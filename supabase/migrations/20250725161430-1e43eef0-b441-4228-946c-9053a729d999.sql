-- Create admin roles enum and user roles system
CREATE TYPE public.admin_role AS ENUM ('admin', 'moderator');

-- Create user roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role admin_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin roles
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'));

-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Create game settings table
CREATE TABLE public.game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  min_bet_amount NUMERIC(10,2) DEFAULT 1.00,
  max_bet_amount NUMERIC(10,2) DEFAULT 10000.00,
  house_edge NUMERIC(5,4) DEFAULT 0.05,
  settings JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game settings"
ON public.game_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage game settings"
ON public.game_settings
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Insert default game settings
INSERT INTO public.game_settings (game_type, is_enabled, min_bet_amount, max_bet_amount) VALUES
('color_prediction', true, 1.00, 5000.00),
('aviator', true, 10.00, 10000.00),
('andar_bahar', true, 10.00, 5000.00),
('roulette', true, 1.00, 5000.00),
('poker', true, 100.00, 10000.00),
('ludo', true, 10.00, 1000.00),
('rummy', true, 10.00, 2000.00),
('jackpot', true, 10.00, 1000.00);

-- Create alerts table for monitoring
CREATE TABLE public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
ON public.admin_alerts
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage alerts"
ON public.admin_alerts
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id, action_type, target_type, target_id, details
  ) VALUES (
    auth.uid(), p_action_type, p_target_type, p_target_id, p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to create admin alert
CREATE OR REPLACE FUNCTION public.create_admin_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.admin_alerts (
    alert_type, severity, title, description, data
  ) VALUES (
    p_alert_type, p_severity, p_title, p_description, p_data
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;