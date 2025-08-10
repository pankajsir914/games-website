import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MasterAdminUser {
  id: string;
  email?: string;
  username?: string;
  role?: 'MASTER' | 'ADMIN' | 'USER';
}

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: string | null; // Supabase access token
  loading: boolean;
  isMasterAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MasterAdminAuthContext = createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MasterAdminUser | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s?.access_token ?? null);
      const u = s?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.access_token ?? null);
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message || 'Login failed');

      // Verify master admin role via RPC
      const { data: roleRes, error: roleErr } = await supabase.rpc('get_user_highest_role', { _user_id: data.user.id });
      if (roleErr) throw new Error(roleErr.message);
      if (roleRes !== 'master_admin') {
        await supabase.auth.signOut();
        throw new Error('Master Admin role required');
      }

      // Map to local shape
      const accessToken = data.session?.access_token ?? null;
      setSession(accessToken);
      const mapped = { id: data.user.id, email, role: 'MASTER' as const };
      setUser(mapped);
      localStorage.setItem('master_admin_user', JSON.stringify(mapped));
      toast.success('Signed in as Master Admin');
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('master_admin_user');
    setUser(null);
    setSession(null);
  };

  const isMasterAdmin = user?.role === 'MASTER';

  return (
    <MasterAdminAuthContext.Provider value={{ user, session, loading, isMasterAdmin, signIn, signOut }}>
      {children}
    </MasterAdminAuthContext.Provider>
  );
};

export const useMasterAdminAuth = () => {
  const context = useContext(MasterAdminAuthContext);
  if (context === undefined) {
    throw new Error('useMasterAdminAuth must be used within a MasterAdminAuthProvider');
  }
  return context;
};