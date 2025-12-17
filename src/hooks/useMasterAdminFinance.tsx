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
    user_name?: string;
    amount: number;
    status: string;
    created_at: string;
    bank_account_number: string;
    account_holder_name?: string;
    ifsc_code?: string;
    payment_method_type?: string;
    upi_id?: string;
    bank_details?: {
      account_holder?: string;
      bank_name?: string;
      account_number?: string;
    };
  }[];
  payment_requests: {
    id: string;
    user_id: string;
    user_name?: string;
    amount: number;
    status: string;
    created_at: string;
    payment_method: string;
    screenshot_url?: string;
    transaction_ref?: string | null;
  }[];
}

export const useMasterAdminFinance = () => {
  const queryClient = useQueryClient();

  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance'],
    queryFn: async () => {
      // Get current admin's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if current user is master admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isMasterAdmin = userRole?.role === 'master_admin';

      // Get users created by this admin (if not master admin)
      let myUserIds: string[] = [];
      if (!isMasterAdmin) {
        const { data: myUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', user.id);
        myUserIds = myUsers?.map(u => u.id) || [];
      }

      // Get total platform balance
      let totalPlatformBalance = 0;
      if (isMasterAdmin) {
        const { data: wallets } = await supabase
          .from('wallets')
          .select('current_balance');
        totalPlatformBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;
      } else if (myUserIds.length > 0) {
        const { data: wallets } = await supabase
          .from('wallets')
          .select('current_balance')
          .in('user_id', myUserIds);
        totalPlatformBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;
      }

      // Get today's transactions
      const today = new Date().toISOString().split('T')[0];
      let transactions: any[] = [];
      if (isMasterAdmin) {
        const { data } = await supabase
          .from('wallet_transactions')
          .select('*')
          .gte('created_at', today);
        transactions = data || [];
      } else if (myUserIds.length > 0) {
        const { data } = await supabase
          .from('wallet_transactions')
          .select('*')
          .in('user_id', myUserIds)
          .gte('created_at', today);
        transactions = data || [];
      }

      const todayDeposits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0);
      const todayWithdrawals = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0);

      // Get pending requests with admin isolation
      let pendingDeposits = 0;
      let pendingWithdrawals = 0;
      let withdrawalRequests: any[] = [];
      let paymentRequests: any[] = [];
      let recentTransactions: any[] = [];

      if (isMasterAdmin) {
        // Master admin sees all
        const { count: depositCount } = await supabase
          .from('payment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pendingDeposits = depositCount || 0;

        const { count: withdrawalCount } = await supabase
          .from('withdrawal_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pendingWithdrawals = withdrawalCount || 0;

        const { data: wReqs } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        withdrawalRequests = wReqs || [];

        const { data: pReqs } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        paymentRequests = pReqs || [];

        const { data: txns } = await supabase
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        recentTransactions = txns || [];
      } else if (myUserIds.length > 0) {
        // Regular admin only sees their created users' data
        const { count: depositCount } = await supabase
          .from('payment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('user_id', myUserIds);
        pendingDeposits = depositCount || 0;

        const { count: withdrawalCount } = await supabase
          .from('withdrawal_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('user_id', myUserIds);
        pendingWithdrawals = withdrawalCount || 0;

        const { data: wReqs } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .in('user_id', myUserIds)
          .order('created_at', { ascending: false })
          .limit(50);
        withdrawalRequests = wReqs || [];

        const { data: pReqs } = await supabase
          .from('payment_requests')
          .select('*')
          .in('user_id', myUserIds)
          .order('created_at', { ascending: false })
          .limit(50);
        paymentRequests = pReqs || [];

        const { data: txns } = await supabase
          .from('wallet_transactions')
          .select('*')
          .in('user_id', myUserIds)
          .order('created_at', { ascending: false })
          .limit(10);
        recentTransactions = txns || [];
      }

      // Get user profiles for enriching data
      const allUserIds = [
        ...new Set([
          ...withdrawalRequests.map(w => w.user_id),
          ...paymentRequests.map(p => p.user_id),
          ...recentTransactions.map(t => t.user_id)
        ])
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return {
        total_platform_balance: totalPlatformBalance,
        total_deposits_today: todayDeposits,
        total_withdrawals_today: todayWithdrawals,
        pending_deposits: pendingDeposits,
        pending_withdrawals: pendingWithdrawals,
        platform_profit: todayDeposits * 0.05,
        transaction_volume: todayDeposits + todayWithdrawals,
        top_depositors: [],
        recent_transactions: recentTransactions.map(t => ({
          id: t.id,
          user_id: t.user_id,
          amount: Number(t.amount),
          type: t.type,
          status: 'completed',
          created_at: t.created_at
        })),
        withdrawal_requests: withdrawalRequests.map(w => {
          const profile = profileMap.get(w.user_id);
          return {
            id: w.id,
            user_id: w.user_id,
            user_name: profile?.full_name || profile?.phone || `User ${w.user_id.slice(0, 8)}`,
            amount: Number(w.amount),
            status: w.status,
            created_at: w.created_at,
            bank_account_number: w.bank_account_number,
            account_holder_name: w.account_holder_name,
            ifsc_code: w.ifsc_code,
            payment_method_type: w.payment_method_type,
            upi_id: w.upi_id,
            bank_details: {
              account_holder: w.account_holder_name,
              bank_name: 'Bank',
              account_number: w.bank_account_number
            }
          };
        }),
        payment_requests: paymentRequests.map(p => {
          const profile = profileMap.get(p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            user_name: profile?.full_name || profile?.phone || `User ${p.user_id.slice(0, 8)}`,
            amount: Number(p.amount),
            status: p.status,
            created_at: p.created_at,
            payment_method: p.payment_method,
            screenshot_url: p.screenshot_url,
            transaction_ref: p.transaction_ref || null
          };
        })
      } as FinancialData;
    },
    refetchInterval: 30000,
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
      // Get the payment request first
      const { data: paymentRequest, error: fetchError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment request status with optional admin notes
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: notes || null,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, credit the user's wallet
      if (action === 'approve') {
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: paymentRequest.user_id,
          p_amount: paymentRequest.amount,
          p_type: 'credit',
          p_reason: 'Deposit approved by admin',
          p_game_type: null,
          p_game_session_id: null
        });

        if (walletError) throw walletError;
      }

      return paymentRequest;
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
