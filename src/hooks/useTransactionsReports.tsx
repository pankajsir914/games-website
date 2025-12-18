import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TransactionReport {
  id: string;
  user_id: string;
  user_name: string;
  type: 'deposit' | 'withdrawal' | 'game_win' | 'game_bet';
  amount: number;
  method: string;
  game: string | null;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference: string;
}

interface ReportsStats {
  totalTransactions: number;
  transactionVolume: number;
  averageTransaction: number;
  successRate: number;
  totalDeposits: number;
  totalWithdrawals: number;
  gameRevenue: number;
  netPlatformGain: number;
}

interface UseTransactionsReportsParams {
  dateRange?: { from?: Date; to?: Date };
  transactionType?: string;
  status?: string;
  search?: string;
}

export const useTransactionsReports = (params?: UseTransactionsReportsParams) => {
  return useQuery({
    queryKey: ['transactions-reports', params],
    queryFn: async () => {
      // Get current admin's user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }
      const currentAdminId = user.id;
      console.log('Reports: Fetching data for admin:', currentAdminId);

      // Check if current user is master admin
      const { data: highestRole, error: roleError } = await supabase
        .rpc('get_user_highest_role', { _user_id: currentAdminId });

      if (roleError) {
        console.error('Reports: Role fetch error:', roleError);
      }

      const isMasterAdmin = highestRole === 'master_admin';
      console.log('Reports: Admin role check:', { isMasterAdmin, highestRole });

      // Get users created by this admin (if not master admin)
      let myUserIds: string[] = [];
      if (!isMasterAdmin) {
        const { data: myUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', currentAdminId);
        myUserIds = myUsers?.map(u => u.id) || [];
        console.log('Reports: Admin users found:', myUserIds.length);
      }

      // Build date filter
      let dateFromFilter: string | undefined;
      let dateToFilter: string | undefined;
      
      if (params?.dateRange?.from) {
        dateFromFilter = params.dateRange.from.toISOString();
      }
      
      if (params?.dateRange?.to) {
        // Set to end of day
        const toDate = new Date(params.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        dateToFilter = toDate.toISOString();
      }

      // Fetch wallet transactions
      let transactionsQuery = supabase
        .from('wallet_transactions')
        .select('id, user_id, amount, type, reason, game_type, created_at')
        .order('created_at', { ascending: false });

      if (!isMasterAdmin && myUserIds.length > 0) {
        transactionsQuery = transactionsQuery.in('user_id', myUserIds);
      }

      if (dateFromFilter) {
        transactionsQuery = transactionsQuery.gte('created_at', dateFromFilter);
      }
      
      if (dateToFilter) {
        transactionsQuery = transactionsQuery.lte('created_at', dateToFilter);
      }

      const { data: walletTransactions, error: txnError } = await transactionsQuery.limit(1000);

      if (txnError) {
        console.error('Reports: Error fetching wallet transactions:', txnError);
      }

      // Fetch payment requests (deposits)
      let paymentRequestsQuery = supabase
        .from('payment_requests')
        .select('id, user_id, amount, status, payment_method, transaction_ref, created_at')
        .order('created_at', { ascending: false });

      if (!isMasterAdmin && myUserIds.length > 0) {
        paymentRequestsQuery = paymentRequestsQuery.in('user_id', myUserIds);
      }

      if (dateFromFilter) {
        paymentRequestsQuery = paymentRequestsQuery.gte('created_at', dateFromFilter);
      }
      
      if (dateToFilter) {
        paymentRequestsQuery = paymentRequestsQuery.lte('created_at', dateToFilter);
      }

      const { data: paymentRequests, error: paymentError } = await paymentRequestsQuery.limit(500);

      if (paymentError) {
        console.error('Reports: Error fetching payment requests:', paymentError);
      }

      // Fetch withdrawal requests
      let withdrawalRequestsQuery = supabase
        .from('withdrawal_requests')
        .select('id, user_id, amount, status, created_at')
        .order('created_at', { ascending: false });

      if (!isMasterAdmin && myUserIds.length > 0) {
        withdrawalRequestsQuery = withdrawalRequestsQuery.in('user_id', myUserIds);
      }

      if (dateFromFilter) {
        withdrawalRequestsQuery = withdrawalRequestsQuery.gte('created_at', dateFromFilter);
      }
      
      if (dateToFilter) {
        withdrawalRequestsQuery = withdrawalRequestsQuery.lte('created_at', dateToFilter);
      }

      const { data: withdrawalRequests, error: withdrawalError } = await withdrawalRequestsQuery.limit(500);

      if (withdrawalError) {
        console.error('Reports: Error fetching withdrawal requests:', withdrawalError);
      }

      // Get all user IDs
      const allUserIds = [
        ...new Set([
          ...(walletTransactions?.map(t => t.user_id) || []),
          ...(paymentRequests?.map(p => p.user_id) || []),
          ...(withdrawalRequests?.map(w => w.user_id) || [])
        ])
      ];

      // Fetch user profiles
      let profiles: any[] = [];
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', allUserIds);
        profiles = profilesData || [];
      }

      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // Combine all transactions into a unified format
      const allTransactions: TransactionReport[] = [];

      // Add wallet transactions
      walletTransactions?.forEach(txn => {
        const profile = profileMap.get(txn.user_id);
        const userName = profile?.full_name || profile?.phone || `User ${txn.user_id.slice(0, 8)}`;
        
        let type: 'deposit' | 'withdrawal' | 'game_win' | 'game_bet' = 'deposit';
        if (txn.type === 'debit') {
          type = txn.reason?.toLowerCase().includes('withdraw') ? 'withdrawal' : 'game_bet';
        } else if (txn.type === 'credit') {
          type = txn.reason?.toLowerCase().includes('win') || txn.reason?.toLowerCase().includes('reward') ? 'game_win' : 'deposit';
        }

        allTransactions.push({
          id: txn.id,
          user_id: txn.user_id,
          user_name: userName,
          type,
          amount: Number(txn.amount),
          method: txn.game_type || (txn.type === 'credit' ? 'UPI' : 'Bank Transfer'),
          game: txn.game_type || null,
          status: 'completed',
          date: new Date(txn.created_at).toLocaleString(),
          reference: txn.id.slice(0, 12).toUpperCase()
        });
      });

      // Add payment requests as deposits
      paymentRequests?.forEach(pr => {
        const profile = profileMap.get(pr.user_id);
        const userName = profile?.full_name || profile?.phone || `User ${pr.user_id.slice(0, 8)}`;
        
        allTransactions.push({
          id: pr.id,
          user_id: pr.user_id,
          user_name: userName,
          type: 'deposit',
          amount: Number(pr.amount),
          method: pr.payment_method || 'UPI',
          game: null,
          status: pr.status === 'approved' ? 'completed' : pr.status === 'rejected' ? 'failed' : 'pending',
          date: new Date(pr.created_at).toLocaleString(),
          reference: pr.transaction_ref || pr.id.slice(0, 12).toUpperCase()
        });
      });

      // Add withdrawal requests
      withdrawalRequests?.forEach(wr => {
        const profile = profileMap.get(wr.user_id);
        const userName = profile?.full_name || profile?.phone || `User ${wr.user_id.slice(0, 8)}`;
        
        allTransactions.push({
          id: wr.id,
          user_id: wr.user_id,
          user_name: userName,
          type: 'withdrawal',
          amount: Number(wr.amount),
          method: 'Bank Transfer',
          game: null,
          status: wr.status === 'approved' ? 'completed' : wr.status === 'rejected' ? 'failed' : 'pending',
          date: new Date(wr.created_at).toLocaleString(),
          reference: wr.id.slice(0, 12).toUpperCase()
        });
      });

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply filters
      let filteredTransactions = allTransactions;
      
      if (params?.transactionType && params.transactionType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === params.transactionType);
      }

      if (params?.status && params.status !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.status === params.status);
      }

      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t => 
          t.user_name.toLowerCase().includes(searchLower) ||
          t.id.toLowerCase().includes(searchLower) ||
          t.reference.toLowerCase().includes(searchLower)
        );
      }

      // Calculate stats
      const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
      const totalTransactions = filteredTransactions.length;
      const transactionVolume = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
      const averageTransaction = totalTransactions > 0 ? transactionVolume / totalTransactions : 0;
      const successRate = totalTransactions > 0 ? (completedTransactions.length / totalTransactions) * 100 : 0;

      const totalDeposits = filteredTransactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalWithdrawals = filteredTransactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const gameRevenue = filteredTransactions
        .filter(t => (t.type === 'game_bet' || t.type === 'game_win') && t.status === 'completed')
        .reduce((sum, t) => {
          // For game bets, it's revenue (negative), for wins it's payout (positive)
          return sum + (t.type === 'game_bet' ? t.amount : -t.amount);
        }, 0);

      const netPlatformGain = totalDeposits - totalWithdrawals + gameRevenue;

      const stats: ReportsStats = {
        totalTransactions,
        transactionVolume,
        averageTransaction,
        successRate,
        totalDeposits,
        totalWithdrawals,
        gameRevenue,
        netPlatformGain
      };

      console.log('Reports: Data fetched:', {
        transactions: filteredTransactions.length,
        stats
      });

      return {
        transactions: filteredTransactions,
        stats
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

