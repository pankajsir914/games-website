import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface MasterAdminUser {
  id: string;
  username: string; // we will store the email here for compatibility
  role: 'MASTER' | 'ADMIN' | 'USER';
  status?: string;
}

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: Session | null;
  loading: boolean;
  isMasterAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MasterAdminAuthContext = createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MasterAdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth listener first, then fetch session (deadlock-safe per guidelines)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Defer any RPC calls to avoid deadlocks
      if (newSession?.user) {
        setTimeout(() => verifyAndLoadMasterAdmin(newSession.user), 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        // Defer initial verification
        setTimeout(() => verifyAndLoadMasterAdmin(data.session!.user!), 0);
      } else {
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const verifyAndLoadMasterAdmin = async (supabaseUser: User) => {
    try {
      // Check highest role via RPC (SECURITY DEFINER function already exists)
      const { data: roleText, error } = await supabase.rpc('get_user_highest_role', { _user_id: supabaseUser.id });
      if (error) throw error;

      if (roleText !== 'master_admin') {
        // Not a master admin; sign out to avoid partial sessions
        await supabase.auth.signOut();
        setUser(null);
        toast.error('Master Admin role required');
      } else {
        // Map to existing shape (keep role as MASTER for compatibility across app)
        setUser({ id: supabaseUser.id, username: supabaseUser.email || 'master', role: 'MASTER' });
      }
    } catch (e: any) {
      toast.error(e.message || 'Unable to verify admin role');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Signed in as Master Admin');
      // onAuthStateChange will finish loading the user and role
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      throw e;
    } finally {
      // loading will be cleared by verifyAndLoadMasterAdmin
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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