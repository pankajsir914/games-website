-- Remove duplicate SID configurations
-- Keep only one configuration per sport type + sid combination, preferring is_default = true

-- First, identify and keep the preferred records (is_default = true takes priority)
WITH duplicates AS (
  SELECT 
    id,
    sport_type,
    sid,
    is_default,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY sport_type, sid 
      ORDER BY is_default DESC, created_at ASC
    ) as rn
  FROM diamond_sports_config
  WHERE is_active = true
)
-- Delete duplicates (keep only row number 1 for each group)
DELETE FROM diamond_sports_config
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Ensure only one default per sport type
WITH default_duplicates AS (
  SELECT 
    id,
    sport_type,
    is_default,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY sport_type 
      ORDER BY created_at ASC
    ) as rn
  FROM diamond_sports_config
  WHERE is_default = true AND is_active = true
)
UPDATE diamond_sports_config
SET is_default = false
WHERE id IN (
  SELECT id FROM default_duplicates WHERE rn > 1
);

-- Log the cleanup
INSERT INTO admin_activity_logs (
  admin_id,
  action_type,
  details,
  created_at
) VALUES (
  auth.uid(),
  'cleanup_duplicate_sids',
  jsonb_build_object(
    'action', 'Removed duplicate SID configurations',
    'timestamp', NOW()
  ),
  NOW()
);