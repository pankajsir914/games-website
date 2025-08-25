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
      try {
        // Try the new comprehensive function first
        const { data: allUsersData, error: allUsersError } = await supabase
          .rpc('get_all_users_for_master_admin');

        if (!allUsersError && allUsersData) {
          console.log('Fetched users from database:', allUsersData);
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

        // Fallback to existing RPC function
        const { data: userManagementData, error: userError } = await supabase
          .rpc('get_users_management_data', {
            p_limit: 100,
            p_offset: 0
          });

        if (!userError && userManagementData && typeof userManagementData === 'object') {
          const data = userManagementData as any;
          return {
            users: data.users || [],
            total_count: data.total_count || 0,
            blocked_users: 0,
            high_risk_users: 0
          } as UsersResponse;
        }
      } catch (error) {
        console.log('RPC functions not available, falling back to direct queries', error);
      }

      // Final fallback to direct queries
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'master_admin']);

      const adminUserIds = adminUsers?.map(u => u.user_id) || [];

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

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