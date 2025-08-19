-- Add RLS policies for the new Ludo tables

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