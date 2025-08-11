import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export const useMasterAdminActions = () => {
  const qc = useQueryClient();

  const createAdmin = useMutation({
    mutationFn: async ({ fullName, email, phone, password, points }: { fullName: string; email: string; phone?: string; password: string; points?: number }) => {
      // Use email as username for backend user table
      const res = await apiFetch('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          username: email,
          password,
          role: 'ADMIN',
          initialPoints: Math.max(0, Number(points || 0)),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Map duplicate to friendly message
        if (res.status === 409) throw new Error('Admin already exists');
        throw new Error(body.error || 'Failed to create admin');
      }
      return body;
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
