
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total active games
      const { count: activeGames } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total wallet balance across all users
      const { data: walletData } = await supabase
        .from('wallets')
        .select('current_balance');
      
      const totalBalance = walletData?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;

      // Get pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get recent transactions count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentTransactions } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeGames: activeGames || 0,
        totalBalance,
        pendingWithdrawals: pendingWithdrawals || 0,
        recentTransactions: recentTransactions || 0,
      };
    },
  });
};
