-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('deposit_bonus', 'referral', 'cashback', 'free_spins', 'tournament', 'banner')),
  value NUMERIC(10,2),
  percentage NUMERIC(5,2),
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_usage INTEGER DEFAULT 0,
  current_usage INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'inactive', 'high_value', 'new')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'system' CHECK (notification_type IN ('system', 'promotion', 'announcement', 'maintenance')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'inactive', 'high_value', 'new')),
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_count INTEGER DEFAULT 0,
  created_by UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banner promotions table for carousel
CREATE TABLE IF NOT EXISTS public.banner_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  redirect_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions
CREATE POLICY "Admins can manage all promotions" 
ON public.promotions 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can view active promotions" 
ON public.promotions 
FOR SELECT 
USING (is_active = true AND start_date <= NOW() AND end_date >= NOW());

-- RLS Policies for notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- RLS Policies for banner promotions
CREATE POLICY "Admins can manage all banner promotions" 
ON public.banner_promotions 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can view active banner promotions" 
ON public.banner_promotions 
FOR SELECT 
USING (is_active = true AND (start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- Create storage bucket for promotion banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('promotion-banners', 'promotion-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for promotion banners
CREATE POLICY "Admins can upload promotion banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'promotion-banners' AND is_admin_user(auth.uid()));

CREATE POLICY "Anyone can view promotion banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'promotion-banners');

CREATE POLICY "Admins can update promotion banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'promotion-banners' AND is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete promotion banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'promotion-banners' AND is_admin_user(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_promotions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_promotions();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_promotions();

CREATE TRIGGER update_banner_promotions_updated_at
  BEFORE UPDATE ON public.banner_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_promotions();