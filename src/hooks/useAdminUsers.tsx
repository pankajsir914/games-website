
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  current_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  status: 'active' | 'suspended';
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          created_at,
          wallets (
            current_balance
          )
        `);

      if (error) throw error;

      // Get transaction data for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          // Get total deposits
          const { data: deposits } = await supabase
            .from('wallet_transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'credit')
            .or('reason.ilike.%deposit%,reason.ilike.%payment%');

          // Get total withdrawals
          const { data: withdrawals } = await supabase
            .from('wallet_transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'debit')
            .or('reason.ilike.%withdrawal%,reason.ilike.%withdraw%');

          const totalDeposits = deposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const totalWithdrawals = withdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          return {
            id: user.id,
            email: `user${user.id.slice(0, 8)}@example.com`, // Mock email since we don't have access to auth.users
            full_name: user.full_name || 'Unknown User',
            phone: user.phone,
            created_at: user.created_at,
            current_balance: user.wallets?.[0]?.current_balance || 0,
            total_deposits: totalDeposits,
            total_withdrawals: totalWithdrawals,
            status: 'active' as const, // Default to active
          };
        })
      );

      return usersWithStats;
    },
  });
};
