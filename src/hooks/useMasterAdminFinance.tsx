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
      // Mock data for now
      const mockData: FinancialData = {
        total_platform_balance: 2400000,
        total_deposits_today: 1200000,
        total_withdrawals_today: 450000,
        pending_deposits: 15,
        pending_withdrawals: 8,
        platform_profit: 84700,
        transaction_volume: 1650000,
        top_depositors: [
          { user_id: '1', full_name: 'John Doe', total_deposits: 150000 },
          { user_id: '2', full_name: 'Jane Smith', total_deposits: 120000 }
        ],
        recent_transactions: [
          { id: '1', user_id: '1', amount: 5000, type: 'deposit', status: 'completed', created_at: '2024-01-20T14:30:00Z' },
          { id: '2', user_id: '2', amount: 2500, type: 'withdrawal', status: 'pending', created_at: '2024-01-20T13:15:00Z' }
        ],
        withdrawal_requests: [
          { id: '1', user_id: '1', amount: 5000, status: 'pending', created_at: '2024-01-20T12:00:00Z', bank_account_number: '****1234' },
          { id: '2', user_id: '2', amount: 3000, status: 'pending', created_at: '2024-01-20T11:30:00Z', bank_account_number: '****5678' }
        ],
        payment_requests: [
          { id: '1', user_id: '1', amount: 2000, status: 'pending', created_at: '2024-01-20T10:00:00Z', payment_method: 'upi' },
          { id: '2', user_id: '2', amount: 1500, status: 'pending', created_at: '2024-01-20T09:45:00Z', payment_method: 'bank_transfer' }
        ]
      };
      
      return mockData;
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