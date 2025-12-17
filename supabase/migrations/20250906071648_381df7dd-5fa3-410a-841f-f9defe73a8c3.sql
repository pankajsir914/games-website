-- Create a view for live roulette bets with user information
CREATE OR REPLACE VIEW roulette_live_bets AS
SELECT 
  rb.id,
  rb.user_id,
  rb.round_id,
  rb.bet_type,
  rb.bet_value,
  rb.bet_amount,
  rb.status,
  rb.payout_amount,
  rb.created_at,
  rr.round_number,
  rr.status as round_status,
  p.full_name as username
FROM roulette_bets rb
JOIN roulette_rounds rr ON rb.round_id = rr.id
LEFT JOIN profiles p ON rb.user_id = p.id
WHERE rb.created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY rb.created_at DESC;

-- Enable RLS on the view
ALTER VIEW roulette_live_bets SET (security_invoker = on);

-- Grant access to authenticated users
GRANT SELECT ON roulette_live_bets TO authenticated;

-- Create a function to auto-manage roulette rounds
CREATE OR REPLACE FUNCTION auto_manage_roulette_rounds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_round RECORD;
  v_new_round_id UUID;
  v_result JSONB;
BEGIN
  -- Check for active betting round
  SELECT * INTO v_current_round
  FROM roulette_rounds
  WHERE status IN ('betting', 'spinning')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If there's a betting round that expired, spin it
  IF v_current_round.status = 'betting' AND v_current_round.bet_end_time < NOW() THEN
    -- Spin the wheel
    PERFORM process_roulette_round(v_current_round.id);
    
    -- Create new round after a delay
    INSERT INTO roulette_rounds (
      round_number,
      status,
      bet_end_time
    ) VALUES (
      COALESCE((SELECT MAX(round_number) FROM roulette_rounds), 0) + 1,
      'betting',
      NOW() + INTERVAL '30 seconds'
    ) RETURNING id INTO v_new_round_id;
    
    v_result := jsonb_build_object(
      'action', 'spun_and_created_new',
      'old_round_id', v_current_round.id,
      'new_round_id', v_new_round_id
    );
    
  -- If no active round, create one
  ELSIF v_current_round.id IS NULL OR v_current_round.status = 'completed' THEN
    INSERT INTO roulette_rounds (
      round_number,
      status,
      bet_end_time
    ) VALUES (
      COALESCE((SELECT MAX(round_number) FROM roulette_rounds), 0) + 1,
      'betting',
      NOW() + INTERVAL '30 seconds'
    ) RETURNING id INTO v_new_round_id;
    
    v_result := jsonb_build_object(
      'action', 'created_new',
      'new_round_id', v_new_round_id
    );
  ELSE
    v_result := jsonb_build_object(
      'action', 'no_action_needed',
      'current_round_id', v_current_round.id,
      'current_status', v_current_round.status
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create presence tracking for roulette
CREATE TABLE IF NOT EXISTS roulette_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE roulette_presence ENABLE ROW LEVEL SECURITY;

-- Policies for presence
CREATE POLICY "Users can insert own presence" ON roulette_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON roulette_presence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view presence" ON roulette_presence
  FOR SELECT USING (true);

-- Function to update presence
CREATE OR REPLACE FUNCTION update_roulette_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO roulette_presence (user_id, last_seen, is_active)
  VALUES (auth.uid(), NOW(), true)
  ON CONFLICT (user_id) DO UPDATE
  SET last_seen = NOW(), is_active = true;
  
  -- Mark users as inactive if not seen for 30 seconds
  UPDATE roulette_presence
  SET is_active = false
  WHERE last_seen < NOW() - INTERVAL '30 seconds';
END;
$$;