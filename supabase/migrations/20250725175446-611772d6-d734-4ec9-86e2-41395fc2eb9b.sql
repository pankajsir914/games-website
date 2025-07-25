-- Add CRON job for Aviator auto-management (every 5 seconds)
SELECT cron.schedule(
  'aviator-auto-manage',
  '*/5 * * * * *', -- every 5 seconds
  $$
  SELECT
    net.http_post(
        url:='https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/aviator-game-manager?action=auto_manage',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk"}'::jsonb
    ) as request_id;
  $$
);

-- Insert Aviator game settings if they don't exist
INSERT INTO public.game_settings (game_type, is_enabled, maintenance_mode, min_bet_amount, max_bet_amount, house_edge, settings)
VALUES (
  'aviator',
  true,
  false,
  10.00,
  10000.00,
  0.03,
  '{
    "cheat_mode": false,
    "forced_multiplier": null,
    "crash_pattern": "random",
    "betting_duration": 7,
    "flight_speed": 1.0
  }'::jsonb
)
ON CONFLICT (game_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();