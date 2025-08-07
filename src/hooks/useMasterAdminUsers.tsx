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
      // Mock data for now
      const mockData: UsersResponse = {
        users: [
          {
            id: '1',
            email: 'user1@example.com',
            full_name: 'John Doe',
            phone: '+91 9876543210',
            created_at: '2024-01-15T10:30:00Z',
            last_sign_in_at: '2024-01-20T14:20:00Z',
            current_balance: 2500,
            total_deposits: 10000,
            total_withdrawals: 7500,
            games_played: 156,
            kyc_status: 'verified',
            is_blocked: false,
            risk_level: 'low'
          },
          {
            id: '2',
            email: 'user2@example.com',
            full_name: 'Jane Smith',
            phone: '+91 9876543211',
            created_at: '2024-01-16T09:15:00Z',
            last_sign_in_at: '2024-01-20T16:45:00Z',
            current_balance: 1800,
            total_deposits: 5000,
            total_withdrawals: 3200,
            games_played: 89,
            kyc_status: 'pending',
            is_blocked: false,
            risk_level: 'medium'
          }
        ],
        total_count: 15247,
        blocked_users: 23,
        pending_kyc: 156,
        high_risk_users: 45
      };
      
      return mockData;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, action, reason }: { 
      userId: string; 
      action: 'block' | 'unblock' | 'suspend'; 
      reason?: string 
    }) => {
      // For now, just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
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