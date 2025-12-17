-- Add missing unique constraint for rate limiting table
ALTER TABLE public.rate_limit_attempts 
ADD CONSTRAINT rate_limit_attempts_user_endpoint_unique 
UNIQUE (user_id, ip_address, endpoint);

-- Add index for performance on rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_endpoint_time 
ON public.rate_limit_attempts (endpoint, last_attempt_at);

-- Add index for blocked attempts lookup
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_blocked 
ON public.rate_limit_attempts (blocked_until);