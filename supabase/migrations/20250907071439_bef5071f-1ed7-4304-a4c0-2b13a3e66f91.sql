-- Clear existing SID configurations to start fresh
DELETE FROM diamond_sports_config;

-- Insert correct SIDs from Diamond Sports API
INSERT INTO diamond_sports_config (sport_type, sid, is_active, label, is_default) VALUES
-- Primary sports
('cricket', '1', true, 'Cricket', true),
('football', '4', true, 'Soccer', false),
('tennis', '5', true, 'Tennis', false),
('basketball', '15', true, 'Basketball', false),  -- Fixed from 7 to 15
('baseball', '3', true, 'Baseball', false),
('hockey', '13', true, 'Ice Hockey', false),
('kabaddi', '8', true, 'Kabaddi', false),
('boxing', '6', true, 'Boxing', false),
('table-tennis', '20', true, 'Table Tennis', false),
('volleyball', '23', true, 'Volleyball', false),
('handball', '12', true, 'Handball', false),
('american-football', '2', true, 'American Football', false),
('rugby', '19', true, 'Rugby', false),
('golf', '11', true, 'Golf', false),
('horse-racing', '14', true, 'Horse Racing', false),
('motor-sports', '16', true, 'Motor Sports', false),
('badminton', '34', true, 'Badminton', false),
('swimming', '21', true, 'Swimming', false),
('athletics', '22', true, 'Athletics', false),
('cycling', '9', true, 'Cycling', false);

-- Log the update
INSERT INTO admin_activity_logs (admin_id, action_type, target_type, details)
VALUES (
  auth.uid(),
  'update_sports_sids',
  'sports_config',
  jsonb_build_object(
    'message', 'Updated Diamond Sports SIDs with correct values from API',
    'total_sports', 20
  )
);