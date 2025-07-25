-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create CRON job to auto-manage color prediction rounds every 10 seconds
SELECT cron.schedule(
  'color-prediction-auto-manager',
  '*/10 * * * * *', -- Every 10 seconds
  $$
  SELECT
    net.http_post(
        url:='https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/color-prediction-manager?action=auto_manage',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);