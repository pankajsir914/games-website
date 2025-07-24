
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAdminWithdrawals = () => {
  const queryClient = useQueryClient();

  const withdrawalsQuery = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data: withdrawals, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          user_id,
          amount,
          status,
          account_holder_name,
          bank_account_number,
          ifsc_code,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for the withdrawals
      const userIds = [...new Set(withdrawals.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Create a map of user profiles
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return withdrawals.map(withdrawal => ({
        id: withdrawal.id,
        user: profileMap.get(withdrawal.user_id)?.full_name || 'Unknown User',
        amount: Number(withdrawal.amount),
        method: 'Bank Transfer',
        accountDetails: `${withdrawal.bank_account_number?.slice(-4)} (${withdrawal.ifsc_code})`,
        status: withdrawal.status,
        requestTime: new Date(withdrawal.created_at).toLocaleString(),
        avatar: withdrawal.user_id.slice(0, 2).toUpperCase(),
      }));
    },
  });

  const processWithdrawal = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const { data, error } = await supabase.rpc('process_withdrawal_request', {
        p_request_id: id,
        p_status: status,
        p_admin_notes: adminNotes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast({
        title: "Withdrawal Processed",
        description: "The withdrawal request has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    ...withdrawalsQuery,
    processWithdrawal: processWithdrawal.mutate,
    isProcessing: processWithdrawal.isPending,
  };
};
