import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

<<<<<<< HEAD
interface AdminFinancialData {
  total_admin_credits: number;
  total_points_allocated_today: number;
  total_points_distributed_today: number;
  total_admins: number;
  total_moderators: number;
  admin_accounts: {
    id: string;
    user_id: string;
    full_name: string;
    role: string;
    admin_credits: number;
    has_credit_account: boolean;
  }[];
  recent_transactions: {
    id: string;
    admin_id: string;
    full_name?: string;
    role?: string;
    amount: number;
    tx_type: string;
    notes: string;
    to_user_id?: string;
    to_user_name?: string;
    created_at: string;
  }[];
=======
interface FinancialData {
  total_platform_balance: number;
  total_deposits_today: number;
  total_withdrawals_today: number;
  pending_deposits: number;
  pending_withdrawals: number;
  platform_profit: number;
  transaction_volume: number;
  recent_transactions: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
  }[];
  withdrawal_requests: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    status: string;
    created_at: string;
    bank_account_number: string;
    upi_id?: string;
  }[];
  payment_requests: {
    id: string;
    user_id: string;
    full_name?: string;
    amount: number;
    status: string;
    created_at: string;
    payment_method: string;
    screenshot_url?: string;
    transaction_ref?: string;
  }[];
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
}

export const useMasterAdminFinanceMonitoring = () => {
  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance-monitoring'],
    queryFn: async () => {
<<<<<<< HEAD
      console.log('Fetching admin finance data...');
      
      // Get all admin user IDs (admin and moderator roles)
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'moderator', 'master_admin']);
      
      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
      }
      
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      const roleMap = new Map(adminRoles?.map(r => [r.user_id, r.role]) || []);
      
      console.log('Admin user IDs found:', adminUserIds.length, adminUserIds);

      // Get admin profiles using RPC function to bypass RLS
      let adminProfiles: any[] = [];
      if (adminUserIds.length > 0) {
        // Try RPC first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_management_data', {
          p_limit: 500,
          p_offset: 0
        });
        
        if (rpcError) {
          console.error('RPC error fetching profiles:', rpcError);
          // Fallback to direct query
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', adminUserIds);
          
          if (profilesError) {
            console.error('Error fetching admin profiles:', profilesError);
          }
          adminProfiles = profiles || [];
        } else {
          // Filter RPC data to only admin users
          adminProfiles = (rpcData || [])
            .filter((u: any) => adminUserIds.includes(u.id))
            .map((u: any) => ({
              id: u.id,
              full_name: u.full_name,
              email: u.email
            }));
        }
      }
      
      console.log('Admin profiles found:', adminProfiles.length);

      // Get admin credit accounts (for distributing to users)
      let adminCreditAccounts: any[] = [];
      let totalAdminCredits = 0;
      if (adminUserIds.length > 0) {
        const { data: credits, error: creditsError } = await supabase
          .from('admin_credit_accounts')
          .select('*')
          .in('admin_id', adminUserIds);
        
        if (creditsError) {
          console.error('Error fetching admin credit accounts:', creditsError);
        }
        adminCreditAccounts = credits || [];
        totalAdminCredits = adminCreditAccounts.reduce((sum, c) => sum + Number(c.balance || 0), 0);
        console.log('Admin credit accounts found:', adminCreditAccounts.length);
      }

      // Get admin credit transactions
      const today = new Date().toISOString().split('T')[0];
      let todayAllocated = 0;
      let todayDistributed = 0;
      let recentCreditTransactions: any[] = [];
      
      if (adminUserIds.length > 0) {
        const { data: transactions, error: txnError } = await supabase
          .from('admin_credit_transactions')
          .select('*')
          .in('admin_id', adminUserIds)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (txnError) {
          console.error('Error fetching admin credit transactions:', txnError);
        }
        recentCreditTransactions = transactions || [];
        
        // Calculate today's allocations (credits given to admins by master admin)
        const todayTransactions = transactions?.filter(t => t.created_at >= today) || [];
        todayAllocated = todayTransactions
          .filter(t => t.tx_type === 'allocation')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Calculate today's distributions (credits given to users by admins)
        todayDistributed = todayTransactions
          .filter(t => t.tx_type === 'distribution')
          .reduce((sum, t) => sum + Number(t.amount), 0);
      }

      // Count admins and moderators
      const totalAdmins = adminRoles?.filter(r => r.role === 'admin').length || 0;
      const totalModerators = adminRoles?.filter(r => r.role === 'moderator').length || 0;

      // Build admin accounts list - include ALL admins
      const adminAccountsList = adminUserIds.map(userId => {
        const profile = adminProfiles.find(p => p.id === userId);
        const creditAccount = adminCreditAccounts.find(c => c.admin_id === userId);
        const role = roleMap.get(userId) || 'unknown';
        
        return {
          id: creditAccount?.id || `no-account-${userId}`,
          user_id: userId,
          full_name: profile?.full_name || profile?.email || 'Unknown Admin',
          role: role,
          admin_credits: Number(creditAccount?.balance || 0),
          has_credit_account: !!creditAccount
        };
      });

      // Get user profiles for distributed credits
      const toUserIds = recentCreditTransactions.filter(t => t.to_user_id).map(t => t.to_user_id);
      let userProfiles: any[] = [];
      if (toUserIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', toUserIds);
        userProfiles = users || [];
      }

      // Map transactions with admin and user names
      const mappedTransactions = recentCreditTransactions.slice(0, 50).map(t => {
        const adminProfile = adminProfiles.find(p => p.id === t.admin_id);
        const userProfile = userProfiles.find(p => p.id === t.to_user_id);
        return {
          id: t.id,
          admin_id: t.admin_id,
          full_name: adminProfile?.full_name || adminProfile?.email || 'Unknown',
          role: roleMap.get(t.admin_id) || 'unknown',
          amount: Number(t.amount),
          tx_type: t.tx_type,
          notes: t.notes || 'N/A',
          to_user_id: t.to_user_id,
          to_user_name: userProfile?.full_name || (t.to_user_id ? 'Unknown User' : null),
          created_at: t.created_at
        };
      });

      console.log('Admin finance data fetched:', {
        totalAdminCredits,
        todayAllocated,
        todayDistributed,
        totalAdmins,
        totalModerators,
        adminAccountsCount: adminAccountsList.length
      });

      return {
        total_admin_credits: totalAdminCredits,
        total_points_allocated_today: todayAllocated,
        total_points_distributed_today: todayDistributed,
        total_admins: totalAdmins,
        total_moderators: totalModerators,
        admin_accounts: adminAccountsList,
        recent_transactions: mappedTransactions
      } as AdminFinancialData;
=======
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

      const todayDeposits = transactions?.filter(t => t.type === 'credit' && t.reason?.includes('Deposit')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const todayWithdrawals = transactions?.filter(t => t.type === 'debit' && t.reason?.includes('Withdrawal')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get pending requests counts
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
        .limit(50);

      // Get user details for transactions
      const transactionUserIds = recentTransactions?.map(t => t.user_id) || [];
      const { data: transactionProfiles } = transactionUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', transactionUserIds) : { data: [] };

      // Get withdrawal requests
      const { data: withdrawalRequests } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user details for withdrawals
      const withdrawalUserIds = withdrawalRequests?.map(w => w.user_id) || [];
      const { data: withdrawalProfiles } = withdrawalUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', withdrawalUserIds) : { data: [] };

      // Get payment requests
      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user details for payments
      const paymentUserIds = paymentRequests?.map(p => p.user_id) || [];
      const { data: paymentProfiles } = paymentUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', paymentUserIds) : { data: [] };

      return {
        total_platform_balance: totalPlatformBalance,
        total_deposits_today: todayDeposits,
        total_withdrawals_today: todayWithdrawals,
        pending_deposits: pendingDeposits || 0,
        pending_withdrawals: pendingWithdrawals || 0,
        platform_profit: todayDeposits * 0.05, // Estimated 5% profit
        transaction_volume: todayDeposits + todayWithdrawals,
        recent_transactions: recentTransactions?.map(t => {
          const profile = transactionProfiles?.find(p => p.id === t.user_id);
          return {
            id: t.id,
            user_id: t.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(t.amount),
            type: t.type,
            status: 'completed',
            created_at: t.created_at
          };
        }) || [],
        withdrawal_requests: withdrawalRequests?.map(w => {
          const profile = withdrawalProfiles?.find(p => p.id === w.user_id);
          return {
            id: w.id,
            user_id: w.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(w.amount),
            status: w.status,
            created_at: w.created_at,
            bank_account_number: w.bank_account_number,
            upi_id: w.upi_id
          };
        }) || [],
        payment_requests: paymentRequests?.map(p => {
          const profile = paymentProfiles?.find(pr => pr.id === p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            full_name: profile?.full_name || 'Unknown',
            amount: Number(p.amount),
            status: p.status,
            created_at: p.created_at,
            payment_method: p.payment_method,
            screenshot_url: p.screenshot_url,
            transaction_ref: p.transaction_ref
          };
        }) || []
      } as FinancialData;
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    financeData: getFinanceData.data,
    isLoading: getFinanceData.isLoading,
    error: getFinanceData.error,
    refetch: getFinanceData.refetch,
  };
};
