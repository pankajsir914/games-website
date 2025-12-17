-- Update system to use points instead of real money
-- This migration updates column comments and default reasons to reflect points-based system

-- Update wallet_transactions reasons to use points terminology
UPDATE wallet_transactions 
SET reason = REPLACE(REPLACE(reason, 'deposit', 'points added'), 'withdrawal', 'points redeemed')
WHERE reason ILIKE '%deposit%' OR reason ILIKE '%withdrawal%';

-- Add comments to clarify points system
COMMENT ON COLUMN wallets.current_balance IS 'Current points balance';
COMMENT ON COLUMN wallets.locked_balance IS 'Locked points balance';
COMMENT ON COLUMN wallet_transactions.amount IS 'Points amount';
COMMENT ON TABLE wallets IS 'User points wallets';
COMMENT ON TABLE wallet_transactions IS 'Points transaction history';

-- Update payment_requests table to reflect points
COMMENT ON TABLE payment_requests IS 'Points purchase requests';
COMMENT ON COLUMN payment_requests.amount IS 'Points to purchase';

-- Update withdrawal_requests table  
COMMENT ON TABLE withdrawal_requests IS 'Points redemption requests';
COMMENT ON COLUMN withdrawal_requests.amount IS 'Points to redeem';

-- Update admin credit accounts to points
COMMENT ON TABLE admin_credit_accounts IS 'Admin points distribution accounts';
COMMENT ON COLUMN admin_credit_accounts.balance IS 'Available points for distribution';
COMMENT ON TABLE admin_credit_transactions IS 'Admin points distribution history';