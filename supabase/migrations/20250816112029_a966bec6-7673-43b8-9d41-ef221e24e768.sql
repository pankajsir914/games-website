-- Insert Teen Patti game settings if not exists
INSERT INTO public.game_settings (
  game_type,
  is_enabled,
  maintenance_mode,
  min_bet_amount,
  max_bet_amount,
  house_edge,
  is_paused,
  settings
) VALUES (
  'teen_patti',
  true,
  false,
  10.00,
  1000.00,
  0.05,
  false,
  '{
    "round_duration": 60,
    "processing_time": 10,
    "max_bet_per_round": 50000,
    "multipliers": {
      "trail": 5.0,
      "pure_sequence": 4.0,
      "sequence": 3.5,
      "color": 3.0,
      "pair": 2.5,
      "high_card": 1.0
    }
  }'::jsonb
) ON CONFLICT (game_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();