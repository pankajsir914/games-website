import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useMasterAdminActions = () => {
  const qc = useQueryClient();

  const createAdmin = useMutation({
    mutationFn: async ({ fullName, email, phone, password, points }: { fullName: string; email: string; phone?: string; password: string; points?: number }) => {
      const { data, error } = await supabase.rpc('admin_create_admin_user', {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_phone: phone || null,
      });
      if (error) throw error;
      const adminId = (data as any)?.user_id;
      if (points && points > 0 && adminId) {
        const { error: allocErr } = await supabase.rpc('allocate_admin_credits', {
          p_admin_id: adminId,
          p_amount: points,
          p_notes: 'Initial allocation by master admin',
        });
        if (allocErr) throw allocErr;
      }
      return data;
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
