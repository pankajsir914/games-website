import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

export const useMasterAdminFinanceMonitoring = () => {
  const getFinanceData = useQuery({
    queryKey: ['master-admin-finance-monitoring'],
    queryFn: async () => {
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
