import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAdminCredits = () => {
  const queryClient = useQueryClient();

  const balanceQuery = useQuery({
    queryKey: ['admin-credits-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_credit_balance');
      if (error) throw error;
      return Number(data || 0);
    },
    refetchInterval: 30000,
  });

  const distribute = useMutation({
    mutationFn: async ({ userId, amount, notes }: { userId: string; amount: number; notes?: string }) => {
      const { data, error } = await supabase.rpc('transfer_admin_credits_to_user', {
        p_user_id: userId,
        p_amount: amount,
        p_notes: notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits-balance'] });
      toast({ title: 'Points transferred', description: 'User has been credited successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Transfer failed', description: err.message, variant: 'destructive' });
    },
  });

  return {
    balance: balanceQuery.data || 0,
    isLoadingBalance: balanceQuery.isLoading,
    refetchBalance: balanceQuery.refetch,
    distribute: distribute.mutate,
    isDistributing: distribute.isPending,
  };
};