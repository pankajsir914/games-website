-- Enable pg_net extension for cron jobs to make HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Clean up the stale round that's stuck in betting status
UPDATE aviator_rounds 
SET status = 'crashed', 
    crash_time = NOW(),
    updated_at = NOW()
WHERE status = 'betting' 
AND bet_end_time < NOW() - INTERVAL '1 minute';

-- Also mark any orphaned 'flying' rounds as crashed
UPDATE aviator_rounds 
SET status = 'crashed', 
    crash_time = NOW(),
    updated_at = NOW()
WHERE status = 'flying' 
AND bet_end_time < NOW() - INTERVAL '5 minutes';