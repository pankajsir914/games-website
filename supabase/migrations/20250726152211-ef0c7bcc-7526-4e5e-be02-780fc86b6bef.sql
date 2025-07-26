-- Set up cron job to auto-complete expired jackpot rounds
SELECT cron.schedule(
  'complete-expired-jackpot-rounds',
  '*/1 * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/jackpot-auto-complete',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);