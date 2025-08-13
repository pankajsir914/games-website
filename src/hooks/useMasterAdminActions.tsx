import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useMasterAdminActions = () => {
  const qc = useQueryClient();

  const createAdmin = useMutation({
    mutationFn: async ({ fullName, email, phone, password, points }: { fullName: string; email: string; phone?: string; password: string; points?: number }) => {
      try {
        // Create admin user using Supabase function
        const { data, error } = await supabase.rpc('admin_create_admin_user', {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
          p_phone: phone || null
        });

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('already exists')) {
            throw new Error('Admin already exists');
          }
          throw new Error(error.message || 'Failed to create admin');
        }

        // Allocate initial points if specified
        if (points && points > 0 && data && typeof data === 'object' && 'user_id' in data) {
          const { error: creditError } = await supabase.rpc('allocate_admin_credits', {
            p_admin_id: (data as any).user_id,
            p_amount: points,
            p_notes: 'Initial admin credit allocation'
          });

          if (creditError) {
            console.warn('Failed to allocate initial credits:', creditError.message);
          }
        }

        return data;
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create admin');
      }
    },
    onSuccess: () => {
      toast({ title: 'Admin created', description: 'Admin account created and points allocated.' });
      qc.invalidateQueries();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create admin', description: err.message, variant: 'destructive' });
    },
  });

  return { createAdmin: createAdmin.mutate, creating: createAdmin.isPending };
};
