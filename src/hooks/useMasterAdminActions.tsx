import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useMasterAdminActions = () => {
  const qc = useQueryClient();

  const createAdmin = useMutation({
    mutationFn: async ({ fullName, email, phone, password, points }: { fullName: string; email: string; phone?: string; password: string; points?: number }) => {
      const initialPoints = Math.max(0, Number(points || 0));

      // 1) Ensure the user exists in Supabase Auth (sign up if needed)
      const redirectUrl = `${window.location.origin}/`;
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (signErr && !/already|exists/i.test(signErr.message)) {
        throw new Error(signErr.message || 'Failed to create auth user');
      }

      // 2) Promote to admin, ensure profile & wallet
      const { data: setupRes, error: setupErr } = await supabase.rpc('setup_admin_user', {
        user_email: email,
        full_name: fullName,
        phone: phone || null,
      });
      if (setupErr) throw new Error(setupErr.message);
      const userId = (setupRes as any)?.user_id as string | undefined;
      if (!userId) throw new Error('Failed to resolve created admin user ID');

      // 3) Allocate initial admin credits, if any
      if (initialPoints > 0) {
        const { error: creditErr } = await supabase.rpc('allocate_admin_credits', {
          p_admin_id: userId,
          p_amount: initialPoints,
          p_notes: 'Initial admin credits',
        });
        if (creditErr) throw new Error(creditErr.message);
      }

      return { user_id: userId };
    },
    onSuccess: () => {
      toast({ title: 'Admin created', description: 'Admin account created and credits allocated.' });
      qc.invalidateQueries();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create admin', description: err.message, variant: 'destructive' });
    },
  });

  return { createAdmin: createAdmin.mutate, creating: createAdmin.isPending };
};
