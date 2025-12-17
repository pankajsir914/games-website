-- Create new Ludo game tables alongside existing ones

-- Users table for Ludo game authentication (separate from auth.users)
CREATE TABLE IF NOT EXISTS ludo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ludo wallet transactions table
CREATE TABLE IF NOT EXISTS ludo_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ludo_users(id),
    match_id UUID NULL, -- Will reference ludo_matches table
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entry', 'win', 'refund', 'admin_adjust')),
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ludo matches table
CREATE TABLE IF NOT EXISTS ludo_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ludo_users(id),
    mode TEXT NOT NULL CHECK (mode IN ('2p', '4p')),
    entry_fee INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
    winner TEXT NULL CHECK (winner IN ('P1', 'P2', 'P3', 'P4')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    bot_difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (bot_difficulty IN ('easy', 'normal', 'pro'))
);

-- Ludo match state table
CREATE TABLE IF NOT EXISTS ludo_match_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES ludo_matches(id) UNIQUE,
    turn TEXT NOT NULL DEFAULT 'P1' CHECK (turn IN ('P1', 'P2', 'P3', 'P4')),
    dice_history JSONB NOT NULL DEFAULT '[]',
    consecutive_sixes INTEGER NOT NULL DEFAULT 0,
    board JSONB NOT NULL DEFAULT '{}',
    last_move JSONB NULL,
    seed TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ludo match logs table for audit trail
CREATE TABLE IF NOT EXISTS ludo_match_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES ludo_matches(id),
    actor TEXT NOT NULL CHECK (actor IN ('P1', 'P2', 'P3', 'P4', 'system')),
    action TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for ludo_wallet_transactions.match_id
ALTER TABLE ludo_wallet_transactions ADD CONSTRAINT IF NOT EXISTS fk_ludo_wallet_transactions_match_id 
    FOREIGN KEY (match_id) REFERENCES ludo_matches(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ludo_wallet_transactions_user_id ON ludo_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ludo_wallet_transactions_match_id ON ludo_wallet_transactions(match_id);
CREATE INDEX IF NOT EXISTS idx_ludo_matches_user_id ON ludo_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_ludo_matches_status ON ludo_matches(status);
CREATE INDEX IF NOT EXISTS idx_ludo_match_logs_match_id ON ludo_match_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_ludo_match_state_match_id ON ludo_match_state(match_id);

-- Enable RLS on all tables
ALTER TABLE ludo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_match_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_users (users can only see their own data)
CREATE POLICY "Users can view own ludo profile" ON ludo_users
    FOR SELECT USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update own ludo profile" ON ludo_users
    FOR UPDATE USING (id = (current_setting('app.current_user_id', true))::uuid);

-- RLS Policies for ludo_wallet_transactions
CREATE POLICY "Users can view own ludo transactions" ON ludo_wallet_transactions
    FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can insert own ludo transactions" ON ludo_wallet_transactions
    FOR INSERT WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

-- RLS Policies for ludo_matches
CREATE POLICY "Users can view own ludo matches" ON ludo_matches
    FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can create own ludo matches" ON ludo_matches
    FOR INSERT WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update own ludo matches" ON ludo_matches
    FOR UPDATE USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- RLS Policies for ludo_match_state
CREATE POLICY "Users can view own ludo match state" ON ludo_match_state
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ludo_matches 
            WHERE ludo_matches.id = ludo_match_state.match_id 
            AND ludo_matches.user_id = (current_setting('app.current_user_id', true))::uuid
        )
    );

CREATE POLICY "Users can update own ludo match state" ON ludo_match_state
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ludo_matches 
            WHERE ludo_matches.id = ludo_match_state.match_id 
            AND ludo_matches.user_id = (current_setting('app.current_user_id', true))::uuid
        )
    );

CREATE POLICY "Users can insert own ludo match state" ON ludo_match_state
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ludo_matches 
            WHERE ludo_matches.id = ludo_match_state.match_id 
            AND ludo_matches.user_id = (current_setting('app.current_user_id', true))::uuid
        )
    );

-- RLS Policies for ludo_match_logs
CREATE POLICY "Users can view own ludo match logs" ON ludo_match_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ludo_matches 
            WHERE ludo_matches.id = ludo_match_logs.match_id 
            AND ludo_matches.user_id = (current_setting('app.current_user_id', true))::uuid
        )
    );

CREATE POLICY "Users can insert own ludo match logs" ON ludo_match_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ludo_matches 
            WHERE ludo_matches.id = ludo_match_logs.match_id 
            AND ludo_matches.user_id = (current_setting('app.current_user_id', true))::uuid
        )
    );

-- Create test user with password Test@123 (bcrypt hash)
INSERT INTO ludo_users (username, password_hash, wallet_balance) 
VALUES ('testuser', '$2b$10$K8vM.rE7l.8yNV4ZS4U9ueKgYz5XG1cKQk8mNJ3R2Q7oX1cPdZ5gK', 1000)
ON CONFLICT (username) DO NOTHING;

-- Create a sample completed match for history
INSERT INTO ludo_matches (user_id, mode, entry_fee, status, winner, completed_at) 
SELECT id, '2p', 100, 'completed', 'P1', now() - interval '1 hour'
FROM ludo_users WHERE username = 'testuser' LIMIT 1
ON CONFLICT DO NOTHING;