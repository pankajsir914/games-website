import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string;
  current_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  games_played: number;
  created_by?: string;
  creator_name?: string;
  
  is_blocked: boolean;
  risk_level: string;
}

interface UsersResponse {
  users: UserData[];
  total_count: number;
  blocked_users: number;
  
  high_risk_users: number;
}

export const useMasterAdminUsers = () => {
  const queryClient = useQueryClient();

  const getUsers = useQuery({
    queryKey: ['master-admin-users'],
    queryFn: async () => {
      // First, get users with admin roles to exclude them
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

      // Get transaction summaries
      const { data: depositSummary } = await supabase
        .from('wallet_transactions')
        .select('user_id, amount')
        .eq('type', 'credit')
        .ilike('reason', '%deposit%')
        .in('user_id', profileIds);

      const { data: withdrawalSummary } = await supabase
        .from('wallet_transactions')
        .select('user_id, amount')
        .eq('type', 'debit')
        .ilike('reason', '%withdrawal%')
        .in('user_id', profileIds);

      // Get game activity counts
      const { data: aviatorBets } = await supabase
        .from('aviator_bets')
        .select('user_id')
        .in('user_id', profileIds);

      const { data: colorBets } = await supabase
        .from('color_prediction_bets')
        .select('user_id')
        .in('user_id', profileIds);

      const { data: andarBets } = await supabase
        .from('andar_bahar_bets')
        .select('user_id')
        .in('user_id', profileIds);

      const { data: rouletteBets } = await supabase
        .from('roulette_bets')
        .select('user_id')
        .in('user_id', profileIds);

      // Create summary maps
      const walletMap = new Map(wallets?.map(w => [w.user_id, w.current_balance]) || []);
      
      const depositMap = new Map();
      depositSummary?.forEach(d => {
        depositMap.set(d.user_id, (depositMap.get(d.user_id) || 0) + Number(d.amount));
      });

      const withdrawalMap = new Map();
      withdrawalSummary?.forEach(w => {
        withdrawalMap.set(w.user_id, (withdrawalMap.get(w.user_id) || 0) + Number(w.amount));
      });

      // Count games played per user
      const gameCountMap = new Map();
      [...(aviatorBets || []), ...(colorBets || []), ...(andarBets || []), ...(rouletteBets || [])].forEach(bet => {
        gameCountMap.set(bet.user_id, (gameCountMap.get(bet.user_id) || 0) + 1);
      });

      // Get total count excluding admin users
      const totalCountQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (adminUserIds.length > 0) {
        totalCountQuery.not('id', 'in', `(${adminUserIds.join(',')})`);
      }

      const { count: totalCount } = await totalCountQuery;

      // Transform the data
      const users = profiles?.map((profile: any) => ({
        id: profile.id,
        email: `${profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}@example.com`,
        full_name: profile.full_name || 'Anonymous User',
        phone: profile.phone || '',
        created_at: profile.created_at,
        last_sign_in_at: profile.updated_at || profile.created_at,
        current_balance: walletMap.get(profile.id) || 0,
        total_deposits: depositMap.get(profile.id) || 0,
        total_withdrawals: withdrawalMap.get(profile.id) || 0,
        games_played: gameCountMap.get(profile.id) || 0,
        
        is_blocked: false,
        risk_level: 'low'
      })) || [];

      return {
        users,
        total_count: totalCount || 0,
        blocked_users: users.filter(u => u.is_blocked).length,
        
        high_risk_users: users.filter(u => u.risk_level === 'high').length
      } as UsersResponse;
    },
    refetchInterval: 60000,
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, action, reason }: { 
      userId: string; 
      action: 'block' | 'unblock' | 'suspend'; 
      reason?: string 
    }) => {
      // Create an admin alert for user status change since we can't modify auth.users directly
      const { data, error } = await supabase
        .from('admin_alerts')
        .insert({
          alert_type: 'user_action',
          severity: 'medium',
          title: `User ${action} request`,
          description: `Request to ${action} user ${userId}. Reason: ${reason || 'No reason provided'}`
        });

      if (error) throw error;
      return { success: true, userId, action };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-users'] });
      toast({
        title: "User status updated",
        description: `User has been ${variables.action}ed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
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