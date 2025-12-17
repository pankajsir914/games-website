
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
      console.log('Fetching transactions for admin:', currentAdminId);

      // Check if current user is master admin
      const { data: highestRole, error: roleError } = await supabase
        .rpc('get_user_highest_role', { _user_id: currentAdminId });

      if (roleError) {
        console.error('Role fetch error:', roleError);
      }

      const isMasterAdmin = highestRole === 'master_admin';
      console.log('Transactions - Admin role check:', { isMasterAdmin, highestRole });

      let transactions: any[] = [];
      let userProfiles: any[] = [];

      // First try to get transactions directly - RLS will filter based on access
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
        
        // If RLS blocks, try alternative approach for regular admin
        if (!isMasterAdmin) {
          const { data: myUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('created_by', currentAdminId);
          
          const myUserIds = myUsers?.map(u => u.id) || [];
          console.log('Admin users for transactions:', myUserIds.length);
          
          if (myUserIds.length === 0) {
            return [];
          }

          const { data: filteredData, error: filteredError } = await supabase
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
            .in('user_id', myUserIds)
            .order('created_at', { ascending: false })
            .limit(100);

          if (filteredError) {
            console.error('Error fetching filtered transactions:', filteredError);
            throw filteredError;
          }
          
          transactions = filteredData || [];
        } else {
          throw error;
        }
      } else {
        transactions = data || [];
      }

      console.log('Transactions fetched:', transactions.length);

      // Get user profiles for all transactions
      const userIds = [...new Set(transactions.map(t => t.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        userProfiles = profiles || [];
      }

      // Create a map of user profiles
      const profileMap = new Map(userProfiles.map(p => [p.id, p]));

      return transactions.map(transaction => ({
        id: transaction.id,
        user: profileMap.get(transaction.user_id)?.full_name || 'Unknown User',
        type: transaction.type === 'credit' ? 'deposit' : transaction.reason?.toLowerCase().includes('win') ? 'game_win' : 'withdrawal',
        amount: Number(transaction.amount),
        status: 'completed',
        method: transaction.game_type || (transaction.type === 'credit' ? 'UPI' : 'Bank Transfer'),
        timestamp: new Date(transaction.created_at).toLocaleString(),
        avatar: transaction.user_id.slice(0, 2).toUpperCase(),
      }));
    },
  });
};

