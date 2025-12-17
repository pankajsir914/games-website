
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminTransactions = () => {
  return useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      // Get current admin's user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }
      const currentAdminId = user.id;

      // Check if current user is master admin
      const { data: highestRole, error: roleError } = await supabase
        .rpc('get_user_highest_role', { _user_id: currentAdminId });

      if (roleError) {
        console.error('Role fetch error:', roleError);
      }

      const isMasterAdmin = highestRole === 'master_admin';

      let transactions: any[] = [];
      let userProfiles: any[] = [];

      if (isMasterAdmin) {
        // Master admin can see all transactions
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select(`
            id,
            user_id,
            amount,
            type,
            reason,
            game_type,
            balance_after,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        transactions = data || [];

        // Get user profiles for all transactions
        const userIds = [...new Set(transactions.map(t => t.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          userProfiles = profiles || [];
        }
      } else {
        // Regular admin: Use RLS policies which check profiles.created_by
        // RLS will automatically filter based on created_by, so we don't need to filter by user_id
        // Just fetch all transactions - RLS will only return those from users created by this admin
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select(`
            id,
            user_id,
            amount,
            type,
            reason,
            game_type,
            balance_after,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching transactions:', error);
          throw error;
        }
        
        transactions = data || [];

        // Get user profiles for all transactions
        const userIds = [...new Set(transactions.map(t => t.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          userProfiles = profiles || [];
        }
      }

      // Create a map of user profiles
      const profileMap = new Map(userProfiles.map(p => [p.id, p]));

      return transactions.map(transaction => ({
        id: transaction.id,
        user: profileMap.get(transaction.user_id)?.full_name || 'Unknown User',
        type: transaction.type === 'credit' ? 'deposit' : transaction.reason.toLowerCase().includes('win') ? 'game_win' : 'withdrawal',
        amount: Number(transaction.amount),
        status: 'completed',
        method: transaction.game_type || (transaction.type === 'credit' ? 'UPI' : 'Bank Transfer'),
        timestamp: new Date(transaction.created_at).toLocaleString(),
        avatar: transaction.user_id.slice(0, 2).toUpperCase(),
      }));
    },
  });
};
