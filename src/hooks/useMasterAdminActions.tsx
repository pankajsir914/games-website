import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useMasterAdminActions = () => {
  const qc = useQueryClient();

  const createAdmin = useMutation({
    mutationFn: async ({ fullName, email, phone, password, points }: { fullName: string; email: string; phone?: string; password: string; points?: number }) => {
      try {
        // Use the edge function to create admin user
        const { data, error } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email,
            password,
            fullName,
            phone: phone || null,
            initialPoints: points || 0
          }
        });

        if (error) {
          console.error('Function invocation error:', error);
          throw new Error(error.message || 'Failed to create admin');
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to create admin');
        }

        return data;
      } catch (error: any) {
        console.error('Admin creation error:', error);
        throw new Error(error.message || 'Failed to create admin');
      }
    },
    onSuccess: () => {
      toast({ title: 'Admin created', description: 'Admin account created successfully and can now login.' });
      qc.invalidateQueries();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create admin', description: err.message, variant: 'destructive' });
    },
  });

  return { createAdmin: createAdmin.mutate, creating: createAdmin.isPending };
};
