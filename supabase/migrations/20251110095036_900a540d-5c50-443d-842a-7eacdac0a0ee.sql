-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  target_admin_id UUID REFERENCES auth.users(id),
  sender_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Master admins can create notifications
CREATE POLICY "Master admins can create notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (has_admin_role(auth.uid(), 'master_admin'::admin_role));

-- Master admins can view all notifications
CREATE POLICY "Master admins can view all notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid(), 'master_admin'::admin_role));

-- Admins can view their own notifications
CREATE POLICY "Admins can view their notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid()) AND 
  (target_admin_id = auth.uid() OR target_admin_id IS NULL)
);

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update their notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid()) AND 
  (target_admin_id = auth.uid() OR target_admin_id IS NULL)
)
WITH CHECK (
  is_admin_user(auth.uid()) AND 
  (target_admin_id = auth.uid() OR target_admin_id IS NULL)
);

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_target ON public.admin_notifications(target_admin_id);
CREATE INDEX idx_admin_notifications_created ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(is_read);

-- Create function to auto-delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.admin_notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to delete expired notifications
CREATE TRIGGER trigger_delete_expired_notifications
AFTER INSERT ON public.admin_notifications
EXECUTE FUNCTION delete_expired_notifications();