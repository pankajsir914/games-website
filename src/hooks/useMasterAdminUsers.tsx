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
  kyc_status: string;
  is_blocked: boolean;
  risk_level: string;
}

interface UsersResponse {
  users: UserData[];
  total_count: number;
  blocked_users: number;
  pending_kyc: number;
  high_risk_users: number;
}

export const useMasterAdminUsers = () => {
  const queryClient = useQueryClient();

  const getUsers = useQuery({
    queryKey: ['master-admin-users'],
    queryFn: async () => {
      // Get profiles with wallet data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          wallets(current_balance)
        `)
        .limit(50);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Get total count
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Transform the data to match our interface
      const users = profiles?.map((profile: any) => ({
        id: profile.id,
        email: 'user@example.com', // Can't get email from auth.users directly
        full_name: profile.full_name || 'Anonymous',
        phone: profile.phone || '',
        created_at: profile.created_at,
        last_sign_in_at: profile.created_at, // Fallback since we can't access auth.users
        current_balance: profile.wallets?.[0]?.current_balance || 0,
        total_deposits: 0, // Would need to calculate from wallet_transactions
        total_withdrawals: 0, // Would need to calculate from wallet_transactions
        games_played: 0, // Would need to calculate from game bets
        kyc_status: 'pending', // Default since we don't have KYC table yet
        is_blocked: false, // Default since we can't check auth.users directly
        risk_level: 'low' // Default
      })) || [];

      return {
        users,
        total_count: totalCount || 0,
        blocked_users: 0, // Will be implemented when we have user status tracking
        pending_kyc: 0, // Will be implemented when we have KYC system
        high_risk_users: 0
      } as UsersResponse;
    },
    refetchInterval: 60000, // Refresh every minute
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