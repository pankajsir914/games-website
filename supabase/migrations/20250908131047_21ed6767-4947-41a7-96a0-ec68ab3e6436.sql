-- Fix the SID configurations for proper sports mapping
-- Clear existing configurations first
DELETE FROM diamond_sports_config;

-- Insert correct SID configurations for each sport
INSERT INTO diamond_sports_config (sport_type, sid, label, is_active, is_default) VALUES
-- Cricket (SID=4)
('cricket', '4', 'Cricket - All Matches', true, true),
-- Football/Soccer (SID=1)
('football', '1', 'Football - All Leagues', true, true),
-- Tennis (SID=2)
('tennis', '2', 'Tennis - All Tournaments', true, true),
-- Basketball (SID=7)
('basketball', '7', 'Basketball - All Leagues', true, true),
-- Hockey (SID=8)
('hockey', '8', 'Hockey - All Leagues', true, true),
-- Kabaddi (SID=52)
('kabaddi', '52', 'Kabaddi - All Matches', true, true),
-- Baseball (SID=13)
('baseball', '13', 'Baseball - All Leagues', true, true),
-- Table Tennis (SID=20)
('table-tennis', '20', 'Table Tennis - All Tournaments', true, true),
-- Boxing (SID=6)
('boxing', '6', 'Boxing - All Events', true, true);