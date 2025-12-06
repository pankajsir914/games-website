
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAdminWithdrawals = () => {
  const queryClient = useQueryClient();

  const withdrawalsQuery = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      // Get current admin's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if current user is master admin using user_roles table
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isMasterAdmin = userRole?.role === 'master_admin';

      let withdrawals: any[] = [];

      if (isMasterAdmin) {
        // Master admin can see all withdrawals
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select(`
            id,
            user_id,
            amount,
            status,
            account_holder_name,
            bank_account_number,
            ifsc_code,
            payment_method_type,
            upi_id,
            created_at,
            admin_id
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        withdrawals = data || [];
      } else {
        // Regular admin: get users created by this admin first
        const { data: myUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', user.id);

        const myUserIds = myUsers?.map(u => u.id) || [];

        if (myUserIds.length === 0) {
          return []; // No users, no withdrawals
        }

        // Get withdrawals only from users created by this admin
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select(`
            id,
            user_id,
            amount,
            status,
            account_holder_name,
            bank_account_number,
            ifsc_code,
            payment_method_type,
            upi_id,
            created_at,
            admin_id
          `)
          .in('user_id', myUserIds)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        withdrawals = data || [];
      }

      if (withdrawals.length === 0) {
        return [];
      }

      // Get user profiles with phone as fallback
      const userIds = [...new Set(withdrawals.map(w => w.user_id))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      // Create a map of user profiles
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return withdrawals.map(withdrawal => {
        const accountDetails = withdrawal.payment_method_type === 'upi' 
          ? `UPI: ${withdrawal.upi_id || 'N/A'}` 
          : `${withdrawal.bank_account_number?.slice(-4) || '••••'} (${withdrawal.ifsc_code || 'N/A'})`;
        
        const profile = profileMap.get(withdrawal.user_id);
        const userName = profile?.full_name || profile?.phone || `User ${withdrawal.user_id.slice(0, 8)}`;
        
        return {
          id: withdrawal.id,
          user_id: withdrawal.user_id,
          user: userName,
          amount: Number(withdrawal.amount),
          method: withdrawal.payment_method_type === 'upi' ? 'UPI' : 'Bank Transfer',
          accountDetails,
          status: withdrawal.status,
          requestTime: new Date(withdrawal.created_at).toLocaleString(),
          avatar: userName.slice(0, 2).toUpperCase(),
        };
      });
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
