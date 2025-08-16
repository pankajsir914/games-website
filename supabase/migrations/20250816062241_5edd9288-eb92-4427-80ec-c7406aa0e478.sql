-- Fix RLS policies for banner_promotions table

-- Enable RLS on banner_promotions table
ALTER TABLE public.banner_promotions ENABLE ROW LEVEL SECURITY;

-- Allow master admins to manage all banner promotions
CREATE POLICY "Master admins can manage all banner promotions" 
ON public.banner_promotions 
FOR ALL 
USING (has_admin_role(auth.uid(), 'master_admin'::admin_role))
WITH CHECK (has_admin_role(auth.uid(), 'master_admin'::admin_role));

-- Allow everyone to view active banner promotions
CREATE POLICY "Anyone can view active banner promotions" 
ON public.banner_promotions 
FOR SELECT 
USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- Allow admins to view all banner promotions
CREATE POLICY "Admins can view all banner promotions" 
ON public.banner_promotions 
FOR SELECT 
USING (is_admin_user(auth.uid()));