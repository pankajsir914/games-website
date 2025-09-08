-- Clear any existing configurations and reset with correct Diamond Sports SIDs
DELETE FROM diamond_sports_config;

-- Insert correct SID configurations for Diamond Sports API
INSERT INTO diamond_sports_config (sport_type, sid, label, is_active, is_default) VALUES
-- Cricket (SID=4)
('cricket', '4', 'Cricket - All Matches', true, true),
-- Football/Soccer (SID=1)  
('football', '1', 'Football - All Leagues', true, false),
-- Tennis (SID=2)
('tennis', '2', 'Tennis - All Tournaments', true, false),
-- Basketball (SID=7)
('basketball', '7', 'Basketball - All Leagues', true, false),
-- Hockey (SID=8)
('hockey', '8', 'Hockey - All Leagues', true, false);