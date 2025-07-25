import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  return useQuery({
    queryKey: ['admin-auth'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        user,
        role: userRole?.role || null,
        isAdmin: userRole?.role === 'admin',
        isModerator: userRole?.role === 'moderator',
        hasAccess: userRole?.role === 'admin' || userRole?.role === 'moderator'
      };
    },
  });
};