import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FinancialData {
  total_platform_balance: number;
  total_deposits_today: number;
  total_withdrawals_today: number;
  pending_deposits: number;
  pending_withdrawals: number;
  platform_profit: number;
  transaction_volume: number;
  top_depositors: {
    user_id: string;
    full_name: string;
    total_deposits: number;
  }[];
  recent_transactions: {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
  }[];
  withdrawal_requests: {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    created_at: string;
    bank_account_number: string;
  }[];
  payment_requests: {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    created_at: string;
    payment_method: string;
  }[];
}

export const useMasterAdminFinance = () => {
  const queryClient = useQueryClient();

  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance'],
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

      const todayDeposits = transactions?.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const todayWithdrawals = transactions?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get pending requests
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
        .limit(10);

      // Get withdrawal and payment requests
      const { data: withdrawalRequests } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      return {
        total_platform_balance: totalPlatformBalance,
        total_deposits_today: todayDeposits,
        total_withdrawals_today: todayWithdrawals,
        pending_deposits: pendingDeposits || 0,
        pending_withdrawals: pendingWithdrawals || 0,
        platform_profit: todayDeposits * 0.05, // Estimated profit
        transaction_volume: todayDeposits + todayWithdrawals,
        top_depositors: [], // Would need complex query to calculate
        recent_transactions: recentTransactions?.map(t => ({
          id: t.id,
          user_id: t.user_id,
          amount: Number(t.amount),
          type: t.type,
          status: 'completed',
          created_at: t.created_at
        })) || [],
        withdrawal_requests: withdrawalRequests?.map(w => ({
          id: w.id,
          user_id: w.user_id,
          amount: Number(w.amount),
          status: w.status,
          created_at: w.created_at,
          bank_account_number: w.bank_account_number
        })) || [],
        payment_requests: paymentRequests?.map(p => ({
          id: p.id,
          user_id: p.user_id,
          amount: Number(p.amount),
          status: p.status,
          created_at: p.created_at,
          payment_method: p.payment_method
        })) || []
      } as FinancialData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const processPaymentRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      action, 
      notes 
    }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('payment_requests')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: notes,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // If approved, credit the user's wallet
      if (action === 'approve') {
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: data.user_id,
          p_amount: data.amount,
          p_type: 'credit',
          p_reason: 'Deposit approved by admin',
          p_game_type: null,
          p_game_session_id: null
        });

        if (walletError) throw walletError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-finance'] });
      toast({
        title: "Payment request processed",
        description: "The request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processWithdrawalRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      action, 
      notes 
    }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: notes,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-finance'] });
      toast({
        title: "Withdrawal request processed",
        description: "The request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    financeData: getFinanceData.data,
    isLoading: getFinanceData.isLoading,
    error: getFinanceData.error,
    refetch: getFinanceData.refetch,
    processPaymentRequest: processPaymentRequest.mutate,
    processWithdrawalRequest: processWithdrawalRequest.mutate,
    isProcessing: processPaymentRequest.isPending || processWithdrawalRequest.isPending,
  };
};