import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-auth'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) return null;

        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Role fetch error:', roleError);
          throw roleError;
        }

        const role = userRole?.role || null;
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
        console.error('Admin auth error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/admin/login';
    }
  };

  return {
    ...query,
    logout,
  };
};