import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinancialMonitoringData {
  totalRevenue: number;
  totalDeposits: number;
  depositCount: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  platformBalance: number;
  pendingDeposits: number;
  pendingDepositsAmount: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  houseProfit: number;
  todayDeposits: number;
  todayWithdrawals: number;
  totalUsers: number;
  totalUserBalance: number;
  avgUserBalance: number;
  avgDepositAmount: number;
  avgWithdrawalAmount: number;
}

export const useMasterAdminFinanceMonitoring = () => {
  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance-monitoring'],
    queryFn: async () => {
      // Get total platform balance from all wallets
      const { data: wallets } = await supabase
        .from('wallets')
        .select('current_balance');
      
      const totalPlatformBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;
      const totalUsers = wallets?.length || 0;
      const avgUserBalance = totalUsers > 0 ? totalPlatformBalance / totalUsers : 0;

      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's transactions
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .gte('created_at', today);

      const todayDeposits = transactions?.filter(t => t.type === 'credit' && t.reason?.toLowerCase().includes('deposit')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const todayWithdrawals = transactions?.filter(t => t.type === 'debit' && t.reason?.toLowerCase().includes('withdraw')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get all deposits
      const { data: allDeposits } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'credit')
        .ilike('reason', '%deposit%');
      
      const totalDeposits = allDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const depositCount = allDeposits?.length || 0;
      const avgDepositAmount = depositCount > 0 ? totalDeposits / depositCount : 0;

      // Get all withdrawals
      const { data: allWithdrawals } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'debit')
        .ilike('reason', '%withdraw%');
      
      const totalWithdrawals = allWithdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const withdrawalCount = allWithdrawals?.length || 0;
      const avgWithdrawalAmount = withdrawalCount > 0 ? totalWithdrawals / withdrawalCount : 0;

      // Get pending deposits
      const { data: pendingDepositData, count: pendingDepositCount } = await supabase
        .from('payment_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending');
      
      const pendingDepositsAmount = pendingDepositData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Get pending withdrawals
      const { data: pendingWithdrawalData, count: pendingWithdrawalCount } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending');
      
      const pendingWithdrawalsAmount = pendingWithdrawalData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      // Calculate house profit (estimated from bets)
      const { data: bets } = await supabase
        .from('aviator_bets')
        .select('bet_amount, win_amount');
      
      const totalBets = bets?.reduce((sum, b) => sum + Number(b.bet_amount), 0) || 0;
      const totalWins = bets?.reduce((sum, b) => sum + Number(b.win_amount || 0), 0) || 0;
      const houseProfit = totalBets - totalWins;

      return {
        totalRevenue: totalDeposits,
        totalDeposits,
        depositCount,
        totalWithdrawals,
        withdrawalCount,
        platformBalance: totalPlatformBalance,
        pendingDeposits: pendingDepositCount || 0,
        pendingDepositsAmount,
        pendingWithdrawals: pendingWithdrawalCount || 0,
        pendingWithdrawalsAmount,
        houseProfit: Math.max(0, houseProfit),
        todayDeposits,
        todayWithdrawals,
        totalUsers,
        totalUserBalance: totalPlatformBalance,
        avgUserBalance,
        avgDepositAmount,
        avgWithdrawalAmount,
      } as FinancialMonitoringData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    financeData: getFinanceData.data,
    isLoading: getFinanceData.isLoading,
    error: getFinanceData.error,
    refetch: getFinanceData.refetch,
  };
};
