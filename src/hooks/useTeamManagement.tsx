import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  admin_credits: number; // Credits admin can distribute to users
  status: 'active' | 'inactive' | 'suspended';
}

export const useTeamManagement = () => {
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      // Use edge function to get team members with proper auth data
      const { data, error } = await supabase.functions.invoke('get-team-members');

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch team members');
      }

      return data.teamMembers || [];
    }
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('update_user_status', {
        p_user_id: userId,
        p_action: action,
        p_reason: reason
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({ title: 'User status updated', description: 'Action logged successfully.' });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    }
  });

  return {
    teamMembers,
    isLoading,
    error,
    updateUserStatus: updateUserStatus.mutate,
    isUpdating: updateUserStatus.isPending
  };
};

function getStatusFromLastSignIn(lastSignIn: string | null): 'active' | 'inactive' | 'suspended' {
  if (!lastSignIn) return 'inactive';
  
  const lastSignInDate = new Date(lastSignIn);
  const now = new Date();
  const daysDiff = (now.getTime() - lastSignInDate.getTime()) / (1000 * 3600 * 24);
  
  if (daysDiff < 1) return 'active';
  if (daysDiff < 7) return 'inactive';
  return 'suspended';
}