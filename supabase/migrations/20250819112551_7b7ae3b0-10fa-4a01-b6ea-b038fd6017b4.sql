-- Complete Ludo Game Platform Database Schema
-- Drop existing tables that conflict with new design
DROP TABLE IF EXISTS ludo_rooms CASCADE;
DROP TABLE IF EXISTS ludo_player_sessions CASCADE;
DROP TABLE IF EXISTS ludo_moves CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;

-- Users table (admin-created only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    match_id UUID NULL, -- Will reference matches table
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entry', 'win', 'refund', 'admin_adjust')),
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    mode TEXT NOT NULL CHECK (mode IN ('2p', '4p')),
    entry_fee INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
    winner TEXT NULL CHECK (winner IN ('P1', 'P2', 'P3', 'P4')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    bot_difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (bot_difficulty IN ('easy', 'normal', 'pro'))
);

-- Match state table
CREATE TABLE match_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) UNIQUE,
    turn TEXT NOT NULL DEFAULT 'P1' CHECK (turn IN ('P1', 'P2', 'P3', 'P4')),
    dice_history JSONB NOT NULL DEFAULT '[]',
    consecutive_sixes INTEGER NOT NULL DEFAULT 0,
    board JSONB NOT NULL DEFAULT '{}',
    last_move JSONB NULL,
    seed TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Match logs table for audit trail
CREATE TABLE match_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id),
    actor TEXT NOT NULL CHECK (actor IN ('P1', 'P2', 'P3', 'P4', 'system')),
    action TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for wallet_transactions.match_id
ALTER TABLE wallet_transactions ADD CONSTRAINT fk_wallet_transactions_match_id 
    FOREIGN KEY (match_id) REFERENCES matches(id);

-- Indexes for performance
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_match_id ON wallet_transactions(match_id);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_logs_match_id ON match_logs(match_id);
CREATE INDEX idx_match_state_match_id ON match_state(match_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (users can only see their own data)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for matches
CREATE POLICY "Users can view own matches" ON matches
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own matches" ON matches
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own matches" ON matches
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for match_state
CREATE POLICY "Users can view own match state" ON match_state
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_state.match_id 
            AND matches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own match state" ON match_state
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_state.match_id 
            AND matches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own match state" ON match_state
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_state.match_id 
            AND matches.user_id = auth.uid()
        )
    );

-- RLS Policies for match_logs
CREATE POLICY "Users can view own match logs" ON match_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_logs.match_id 
            AND matches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own match logs" ON match_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_logs.match_id 
            AND matches.user_id = auth.uid()
        )
    );

-- Admin bypass policies (for master admin users)
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can manage all transactions" ON wallet_transactions
    FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can manage all matches" ON matches
    FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can manage all match states" ON match_state
    FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can manage all match logs" ON match_logs
    FOR ALL USING (has_admin_role(auth.uid(), 'master_admin'));

-- Create test user with password Test@123
INSERT INTO users (username, password_hash, wallet_balance) 
VALUES ('testuser', '$2b$10$K8vM.rE7l.8yNV4ZS4U9ueKgYz5XG1cKQk8mNJ3R2Q7oX1cPdZ5gK', 1000);

-- Create a sample completed match for history
INSERT INTO matches (user_id, mode, entry_fee, status, winner, completed_at) 
SELECT id, '2p', 100, 'completed', 'P1', now() - interval '1 hour'
FROM users WHERE username = 'testuser' LIMIT 1;