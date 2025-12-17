-- Phase 1: CRITICAL Database Fixes for Color Prediction Game

-- Step 1: Enable the color prediction game
UPDATE game_settings 
SET 
  is_enabled = true, 
  is_paused = false, 
  updated_at = NOW() 
WHERE game_type = 'color_prediction';

-- Step 2: Complete the stuck round #34
-- This round has been stuck in 'betting' status since 2025-01-10
UPDATE color_prediction_rounds 
SET 
  status = 'completed', 
  winning_color = 'green', 
  draw_time = NOW(), 
  updated_at = NOW()
WHERE id = '9955eec0-e5c1-4bc6-a3a4-840fe270f324' 
  AND status = 'betting';

-- Step 3: Insert default color prediction settings if not exists
INSERT INTO game_settings (game_type, is_enabled, is_paused, min_bet_amount, max_bet_amount, house_edge, settings)
VALUES ('color_prediction', true, false, 10.00, 10000.00, 0.05, '{"round_duration": 30}'::jsonb)
ON CONFLICT (game_type) DO NOTHING;