import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalPointsDistributed: number;
  activeSessions: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  todayBets: number;
  todayRevenue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netPL: number;
  usersGrowth: number;
  pointsGrowth: number;
  sessionsGrowth: number;
}

export const useAdminDashboardStats = () => {
  const [realTimeStats, setRealTimeStats] = useState<DashboardStats | null>(null);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching admin dashboard stats...');

      // Get current admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if current user is master admin
      const { data: highestRole } = await supabase
        .rpc('get_user_highest_role', { _user_id: user.id });
      
      const isMasterAdmin = highestRole === 'master_admin';

      // Get users created by this admin
      let myUserIds: string[] = [];
      if (!isMasterAdmin) {
        const { data: myUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', user.id);
        myUserIds = myUsers?.map(u => u.id) || [];
      }

      // Get total users count created by this admin
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_management_data', {
          p_limit: 10000,
          p_offset: 0,
          p_search: null,
          p_status: 'all'
        });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
        throw usersError;
      }

      const totalUsers = (usersData as any)?.total_count || 0;

      // Get total points distributed (admin credit transactions)
      const { data: pointsData, error: pointsError } = await supabase
        .from('admin_credit_transactions')
        .select('amount')
        .eq('tx_type', 'distribution');

      if (pointsError) {
        console.error('Error fetching points data:', pointsError);
        throw pointsError;
      }

      const totalPointsDistributed = pointsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      // Get active sessions (users with activity in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: activeSessions, error: sessionsError } = await supabase
        .from('wallet_transactions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyMinutesAgo);

      if (sessionsError) {
        console.error('Error fetching active sessions:', sessionsError);
        throw sessionsError;
      }

      // Get pending deposits
      let depositsQuery = supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!isMasterAdmin && myUserIds.length > 0) {
        depositsQuery = depositsQuery.in('user_id', myUserIds);
      }

      const { count: pendingDeposits, error: depositsError } = await depositsQuery;

      if (depositsError) {
        console.error('Error fetching pending deposits:', depositsError);
        throw depositsError;
      }

      // Get pending withdrawals
      let withdrawalsQuery = supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!isMasterAdmin && myUserIds.length > 0) {
        withdrawalsQuery = withdrawalsQuery.in('user_id', myUserIds);
      }

      const { count: pendingWithdrawals, error: withdrawalsError } = await withdrawalsQuery;

      if (withdrawalsError) {
        console.error('Error fetching pending withdrawals:', withdrawalsError);
        throw withdrawalsError;
      }

      // Get today's bets count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: aviatorBets } = await supabase
        .from('aviator_bets')
        .select('bet_amount')
        .gte('created_at', today.toISOString());

      const { data: colorBets } = await supabase
        .from('color_prediction_bets')
        .select('bet_amount')
        .gte('created_at', today.toISOString());

      const { data: andarBets } = await supabase
        .from('andar_bahar_bets')
        .select('bet_amount')
        .gte('created_at', today.toISOString());

      const { data: rouletteBets } = await supabase
        .from('roulette_bets')
        .select('bet_amount')
        .gte('created_at', today.toISOString());

      const todayBets = (aviatorBets?.length || 0) + (colorBets?.length || 0) + 
                       (andarBets?.length || 0) + (rouletteBets?.length || 0);

      const todayRevenue = [
        ...(aviatorBets || []),
        ...(colorBets || []),
        ...(andarBets || []),
        ...(rouletteBets || [])
      ].reduce((sum, bet) => sum + Number(bet.bet_amount) * 0.05, 0); // 5% house edge

      // Get total deposits (approved payment requests)
      let totalDepositsQuery = supabase
        .from('payment_requests')
        .select('amount')
        .eq('status', 'approved');
      
      if (!isMasterAdmin && myUserIds.length > 0) {
        totalDepositsQuery = totalDepositsQuery.in('user_id', myUserIds);
      }

      const { data: approvedDeposits } = await totalDepositsQuery;
      const totalDeposits = approvedDeposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

      // Get total withdrawals (approved withdrawal requests)
      let totalWithdrawalsQuery = supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('status', 'approved');
      
      if (!isMasterAdmin && myUserIds.length > 0) {
        totalWithdrawalsQuery = totalWithdrawalsQuery.in('user_id', myUserIds);
      }

      const { data: approvedWithdrawals } = await totalWithdrawalsQuery;
      const totalWithdrawals = approvedWithdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      // Calculate Net P&L: Total Deposits - Total Withdrawals + Game Revenue
      const netPL = totalDeposits - totalWithdrawals + todayRevenue;

      // Calculate growth percentages (mock data for now)
      const dashboardStats: DashboardStats = {
        totalUsers: totalUsers || 0,
        totalPointsDistributed,
        activeSessions: activeSessions || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        todayBets,
        todayRevenue,
        totalDeposits,
        totalWithdrawals,
        netPL,
        usersGrowth: 15.2, // Mock growth percentage
        pointsGrowth: 20.1,
        sessionsGrowth: 8.5
      };

      console.log('Dashboard stats fetched:', dashboardStats);
      return dashboardStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for dashboard stats...');

    // Subscribe to user profile changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('Profiles changed, refetching stats...');
          refetch();
        }
      )
      .subscribe();

    // Subscribe to wallet transaction changes
    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions'
        },
        () => {
          console.log('Wallet transactions changed, refetching stats...');
          refetch();
        }
      )
      .subscribe();

    // Subscribe to payment request changes
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests'
        },
        () => {
          console.log('Payment requests changed, refetching stats...');
          refetch();
        }
      )
      .subscribe();

    // Subscribe to withdrawal request changes
    const withdrawalsChannel = supabase
      .channel('withdrawals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        () => {
          console.log('Withdrawal requests changed, refetching stats...');
          refetch();
        }
      )
      .subscribe();

    // Subscribe to bet changes
    const betsChannel = supabase
      .channel('bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aviator_bets'
        },
        () => {
          console.log('Bets changed, refetching stats...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [refetch]);

  // Update real-time stats when data changes
  useEffect(() => {
    if (stats) {
      setRealTimeStats(stats);
    }
  }, [stats]);

  return {
    stats: realTimeStats || stats,
    isLoading,
    error,
    refetch
  };
};
