
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminTransactions = () => {
  return useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
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

      // Get user profiles for the transactions
      const userIds = [...new Set(transactions.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Create a map of user profiles
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

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
