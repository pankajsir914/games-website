import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-auth'],
    queryFn: async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Treat missing session as not authenticated
          if ((sessionError as any).name === 'AuthSessionMissingError' || (sessionError as any).status === 400) {
            return null;
          }
          throw sessionError;
        }
        
        const user = session?.user;
        if (!user) return null;

        const { data: highestRole, error: roleError } = await supabase
          .rpc('get_user_highest_role', { _user_id: user.id });

        if (roleError) {
          console.error('Role fetch error:', roleError);
          // Proceed as regular user if role lookup fails
        }

        const role = (highestRole as string) || null;
        const isAdmin = role === 'admin';
        const isModerator = role === 'moderator';
        const isMasterAdmin = role === 'master_admin';
        const hasAccess = isAdmin || isModerator || isMasterAdmin;

        return {
          user,
          role,
          isAdmin,
          isModerator,
          isMasterAdmin,
          hasAccess
        };
      } catch (error) {
        if ((error as any)?.name === 'AuthSessionMissingError') {
          return null;
        }
        console.error('Admin auth error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Ignore session missing errors - user is already logged out
      if (error && error.message !== 'Auth session missing!' && !error.message.includes('session_not_found')) {
        console.error('Logout error:', error);
      }
      queryClient.clear();
      window.location.href = '/admin/login';
    } catch (error: any) {
      // Only log error if it's not a session issue
      if (error?.message !== 'Auth session missing!' && !error?.message?.includes('session_not_found')) {
        console.error('Logout error:', error);
      }
      // Always redirect even if logout fails
      queryClient.clear();
      window.location.href = '/admin/login';
    }
  };

  return {
    ...query,
    logout,
  };
};