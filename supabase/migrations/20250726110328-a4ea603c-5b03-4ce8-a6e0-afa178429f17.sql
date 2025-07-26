-- Add missing columns and enhance poker tables for real-time gameplay
ALTER TABLE poker_games ADD COLUMN IF NOT EXISTS betting_round INTEGER DEFAULT 0;
ALTER TABLE poker_games ADD COLUMN IF NOT EXISTS last_action_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE poker_games ADD COLUMN IF NOT EXISTS minimum_bet NUMERIC(10,2) DEFAULT 0;
ALTER TABLE poker_games ADD COLUMN IF NOT EXISTS players_in_hand JSONB DEFAULT '[]'::jsonb;
ALTER TABLE poker_games ADD COLUMN IF NOT EXISTS side_pots JSONB DEFAULT '[]'::jsonb;

-- Add player actions tracking
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS current_bet NUMERIC(10,2) DEFAULT 0;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS total_bet_this_hand NUMERIC(10,2) DEFAULT 0;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS is_all_in BOOLEAN DEFAULT FALSE;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS has_acted_this_round BOOLEAN DEFAULT FALSE;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS last_action TEXT;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS connection_id TEXT;
ALTER TABLE poker_players ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create poker game events table for real-time updates
CREATE TABLE IF NOT EXISTS poker_game_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES poker_games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  player_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poker player sessions for connection management
CREATE TABLE IF NOT EXISTS poker_player_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_id UUID NOT NULL REFERENCES poker_tables(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, table_id)
);

-- Enable RLS on new tables
ALTER TABLE poker_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_player_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for poker_game_events
CREATE POLICY "Players can view events for games they're in" ON poker_game_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM poker_players pp
      JOIN poker_games pg ON pg.table_id = pp.table_id
      WHERE pg.id = poker_game_events.game_id AND pp.user_id = auth.uid()
    )
  );

-- RLS policies for poker_player_sessions
CREATE POLICY "Users can manage their own sessions" ON poker_player_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Function to clean up inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_poker_players()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inactive_player RECORD;
BEGIN
  -- Mark players as inactive if no heartbeat for 30 seconds
  UPDATE poker_players 
  SET status = 'disconnected'
  WHERE status = 'active' 
    AND last_heartbeat < NOW() - INTERVAL '30 seconds';
    
  -- Remove players from waiting tables if disconnected for 2 minutes
  FOR inactive_player IN 
    SELECT pp.id, pp.table_id, pp.user_id, pp.chip_count
    FROM poker_players pp
    JOIN poker_tables pt ON pt.id = pp.table_id
    WHERE pp.status = 'disconnected' 
      AND pp.last_heartbeat < NOW() - INTERVAL '2 minutes'
      AND pt.status = 'waiting'
  LOOP
    -- Return chips to wallet
    IF inactive_player.chip_count > 0 THEN
      PERFORM update_wallet_balance(
        inactive_player.user_id,
        inactive_player.chip_count,
        'credit',
        'Poker table auto-cashout due to inactivity',
        'casino',
        inactive_player.table_id
      );
    END IF;
    
    -- Remove player
    DELETE FROM poker_players WHERE id = inactive_player.id;
    
    -- Update table player count
    UPDATE poker_tables
    SET current_players = current_players - 1
    WHERE id = inactive_player.table_id;
  END LOOP;
END;
$$;

-- Function to get poker hand strength (simplified version)
CREATE OR REPLACE FUNCTION get_poker_hand_strength(hole_cards JSONB, community_cards JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  all_cards JSONB;
  card_ranks INTEGER[];
  card_suits TEXT[];
  rank_counts INTEGER[];
  suit_counts INTEGER[];
  i INTEGER;
  hand_rank INTEGER := 0;
BEGIN
  -- Combine hole cards and community cards
  all_cards := hole_cards || community_cards;
  
  -- Extract ranks and suits (simplified - in production use proper card evaluation)
  FOR i IN 0..jsonb_array_length(all_cards)-1 LOOP
    card_ranks := array_append(card_ranks, (all_cards->i->>'rank')::INTEGER);
    card_suits := array_append(card_suits, all_cards->i->>'suit');
  END LOOP;
  
  -- Very simplified hand ranking (in production, implement proper poker hand evaluation)
  -- This is just a placeholder - implement proper hand evaluation logic
  hand_rank := array_length(card_ranks, 1) * 100 + card_ranks[1];
  
  RETURN hand_rank;
END;
$$;

-- Add tables to realtime publication (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'poker_game_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE poker_game_events;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'poker_player_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE poker_player_sessions;
  END IF;
END $$;

-- Set replica identity for realtime
ALTER TABLE poker_game_events REPLICA IDENTITY FULL;
ALTER TABLE poker_player_sessions REPLICA IDENTITY FULL;