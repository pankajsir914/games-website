-- Add paused field to game_settings table
ALTER TABLE game_settings ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Update existing records to set is_paused to false
UPDATE game_settings SET is_paused = false WHERE is_paused IS NULL;