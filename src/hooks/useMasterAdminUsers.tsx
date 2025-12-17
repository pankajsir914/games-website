import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  current_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  games_played: number;
  status: 'online' | 'recently_active' | 'offline';
  is_blocked?: boolean;
  risk_level?: 'low' | 'medium' | 'high';
  created_by?: string;
  creator_name?: string;
  user_role?: string;
}

interface UsersResponse {
  users: UserData[];
  total_count: number;
  blocked_users: number;
  high_risk_users: number;
  online_count?: number;
  recently_active_count?: number;
}

export const useMasterAdminUsers = () => {
  const queryClient = useQueryClient();

  const getUsers = useQuery({
    queryKey: ['master-admin-users'],
    queryFn: async () => {
      // Get current admin's ID and role first
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');

      const { data: highestRole } = await supabase
        .rpc('get_user_highest_role', { _user_id: adminUser.id });
      
      const isMasterAdmin = highestRole === 'master_admin';

      try {
        // Try the existing RPC function that works for all admins
        const { data: userManagementData, error: userError } = await supabase
          .rpc('get_users_management_data', {
            p_limit: 200,
            p_offset: 0,
            p_search: null,
            p_status: 'all'
          });

        if (!userError && userManagementData && typeof userManagementData === 'object') {
          console.log('Fetched users from get_users_management_data:', userManagementData);
          const data = userManagementData as any;
          
          // Map the data to our expected format
          let users = (data.users || []).map((user: any) => ({
            id: user.id,
            email: user.email,
            full_name: user.full_name || 'Unknown User',
            phone: user.phone || '',
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at,
            current_balance: user.current_balance || 0,
            total_deposits: user.total_deposits || 0,
            total_withdrawals: user.total_withdrawals || 0,
            games_played: user.games_played || 0,
            status: user.status || 'offline',
            is_blocked: false,
            risk_level: 'low' as const,
            created_by: user.created_by,
            creator_name: user.creator_name,
            user_role: user.user_role
          }));

          // Additional frontend filtering: Only show users created by current admin (if not master admin)
          if (!isMasterAdmin) {
            users = users.filter((user: any) => user.created_by === adminUser.id);
            console.log('Filtered users by created_by:', users.length, 'out of', data.users?.length || 0);
          }
          
          return {
            users,
            total_count: users.length, // Use filtered count
            blocked_users: 0,
            high_risk_users: 0,
            online_count: users.filter((u: any) => u.status === 'online').length,
            recently_active_count: users.filter((u: any) => u.status === 'recently_active').length
          } as UsersResponse;
        }

        // Try the master admin only function as fallback (only for master admin)
        if (isMasterAdmin) {
          const { data: allUsersData, error: allUsersError } = await supabase
            .rpc('get_all_users_for_master_admin');

          if (!allUsersError && allUsersData) {
            console.log('Fetched users from master admin function:', allUsersData);
            const usersData = allUsersData as any;
            
            return {
              users: usersData.users || [],
              total_count: usersData.total_count || 0,
              blocked_users: 0,
              high_risk_users: 0,
              online_count: usersData.online_count || 0,
              recently_active_count: usersData.recently_active_count || 0
            } as UsersResponse;
          }
        }
      } catch (error) {
        console.log('RPC functions not available, falling back to direct queries', error);
      }

      // Final fallback to direct queries
      // Use adminUser already declared above

      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'master_admin']);

      const adminUserIds = adminUsers?.map(u => u.user_id) || [];

      // Get profiles - filter by created_by if regular admin
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!isMasterAdmin) {
        // Regular admin: only get users they created
        profilesQuery = profilesQuery.eq('created_by', adminUser.id);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Filter out admin users from profiles
      const userProfiles = profiles?.filter(p => !adminUserIds.includes(p.id)) || [];
      const profileIds = userProfiles.map(p => p.id);

      // Get wallet data
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_id, current_balance')
        .in('user_id', profileIds);

      const walletMap = new Map(wallets?.map(w => [w.user_id, w.current_balance]) || []);

      // Get transactions summary
      const { data: deposits } = await supabase
        .from('wallet_transactions')
        .select('user_id, amount')
        .in('user_id', profileIds)
        .eq('type', 'credit')
        .ilike('reason', '%deposit%');

      const { data: withdrawals } = await supabase
        .from('wallet_transactions')
        .select('user_id, amount')
        .in('user_id', profileIds)
        .eq('type', 'debit')
        .ilike('reason', '%withdraw%');

      // Aggregate deposits and withdrawals by user
      const depositMap = new Map<string, number>();
      deposits?.forEach(d => {
        const current = depositMap.get(d.user_id) || 0;
        depositMap.set(d.user_id, current + Number(d.amount));
      });

      const withdrawalMap = new Map<string, number>();
      withdrawals?.forEach(w => {
        const current = withdrawalMap.get(w.user_id) || 0;
        withdrawalMap.set(w.user_id, current + Number(w.amount));
      });

      // Get game counts
      const gameQueries = profileIds.map(async (userId) => {
        const aviatorCount = supabase
          .from('aviator_bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const colorCount = supabase
          .from('color_prediction_bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const andarCount = supabase
          .from('andar_bahar_bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const rouletteCount = supabase
          .from('roulette_bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const [aviator, color, andar, roulette] = await Promise.all([
          aviatorCount,
          colorCount,
          andarCount,
          rouletteCount
        ]);

        return {
          userId,
          count: (aviator.count || 0) + (color.count || 0) + (andar.count || 0) + (roulette.count || 0)
        };
      });

      const gameCounts = await Promise.all(gameQueries);
      const gameCountMap = new Map(gameCounts.map(g => [g.userId, g.count]));

      // Format the data
      const users = userProfiles.map(profile => ({
        id: profile.id,
        email: `user${profile.id.slice(0, 8)}@example.com`,
        full_name: profile.full_name || 'Unknown User',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        last_sign_in_at: null,
        current_balance: walletMap.get(profile.id) || 0,
        total_deposits: depositMap.get(profile.id) || 0,
        total_withdrawals: withdrawalMap.get(profile.id) || 0,
        games_played: gameCountMap.get(profile.id) || 0,
        status: 'offline' as const,
        is_blocked: false,
        risk_level: 'low' as const,
        created_by: profile.created_by
      }));

      return {
        users,
        total_count: users.length,
        blocked_users: 0,
        high_risk_users: 0
      } as UsersResponse;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: 'block' | 'unblock' | 'suspend'; reason?: string }) => {
      // Since we can't directly modify auth.users, we'll create an alert
      const { error } = await supabase
        .from('admin_alerts')
        .insert({
          alert_type: 'user_action',
          severity: 'medium',
          title: `User ${action} requested`,
          description: `Action: ${action} for user ${userId}. Reason: ${reason || 'No reason provided'}`,
          data: { userId, action, reason }
        });

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-users'] });
      toast({
        title: 'Success',
        description: 'User status update request logged',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users: getUsers.data,
    isLoading: getUsers.isLoading,
    error: getUsers.error,
    refetch: getUsers.refetch,
    updateUserStatus: updateUserStatus.mutate,
    isUpdating: updateUserStatus.isPending,
  };
};