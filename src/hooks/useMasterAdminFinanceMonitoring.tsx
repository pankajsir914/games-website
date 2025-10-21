import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinancialData {
  total_platform_balance: number;
  total_deposits_today: number;
  total_withdrawals_today: number;
  pending_deposits: number;
  pending_withdrawals: number;
  platform_profit: number;
  transaction_volume: number;
  recent_transactions: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
  }[];
  withdrawal_requests: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    status: string;
    created_at: string;
    bank_account_number: string;
    upi_id?: string;
  }[];
  payment_requests: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    status: string;
    created_at: string;
    payment_method: string;
    screenshot_url?: string;
    transaction_ref?: string;
  }[];
}

export const useMasterAdminFinanceMonitoring = () => {
  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance-monitoring'],
    queryFn: async () => {
      // Get total platform balance
      const { data: wallets } = await supabase
        .from('wallets')
        .select('current_balance');
      
      const totalPlatformBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;

      // Get today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .gte('created_at', today);

      const todayDeposits = transactions?.filter(t => t.type === 'credit' && t.reason?.includes('Deposit')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const todayWithdrawals = transactions?.filter(t => t.type === 'debit' && t.reason?.includes('Withdrawal')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get pending requests counts
      const { count: pendingDeposits } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user details for transactions
      const transactionUserIds = recentTransactions?.map(t => t.user_id) || [];
      const { data: transactionProfiles } = transactionUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', transactionUserIds) : { data: [] };

      // Get withdrawal requests
      const { data: withdrawalRequests } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user details for withdrawals
      const withdrawalUserIds = withdrawalRequests?.map(w => w.user_id) || [];
      const { data: withdrawalProfiles } = withdrawalUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', withdrawalUserIds) : { data: [] };

      // Get payment requests
      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user details for payments
      const paymentUserIds = paymentRequests?.map(p => p.user_id) || [];
      const { data: paymentProfiles } = paymentUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', paymentUserIds) : { data: [] };

      return {
        total_platform_balance: totalPlatformBalance,
        total_deposits_today: todayDeposits,
        total_withdrawals_today: todayWithdrawals,
        pending_deposits: pendingDeposits || 0,
        pending_withdrawals: pendingWithdrawals || 0,
        platform_profit: todayDeposits * 0.05, // Estimated 5% profit
        transaction_volume: todayDeposits + todayWithdrawals,
        recent_transactions: recentTransactions?.map(t => {
          const profile = transactionProfiles?.find(p => p.id === t.user_id);
          return {
            id: t.id,
            user_id: t.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(t.amount),
            type: t.type,
            status: 'completed',
            created_at: t.created_at
          };
        }) || [],
        withdrawal_requests: withdrawalRequests?.map(w => {
          const profile = withdrawalProfiles?.find(p => p.id === w.user_id);
          return {
            id: w.id,
            user_id: w.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(w.amount),
            status: w.status,
            created_at: w.created_at,
            bank_account_number: w.bank_account_number,
            upi_id: w.upi_id
          };
        }) || [],
        payment_requests: paymentRequests?.map(p => {
          const profile = paymentProfiles?.find(pr => pr.id === p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(p.amount),
            status: p.status,
            created_at: p.created_at,
            payment_method: p.payment_method,
            screenshot_url: p.screenshot_url,
            transaction_ref: p.transaction_ref
          };
        }) || []
      } as FinancialData;
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
