import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface MasterAdminUser {
  id: string;
  username: string;
  role: 'MASTER';
}
   
interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: Session | null;
  loading: boolean; // ONLY for protected pages
  isMasterAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MasterAdminAuthContext =
  createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MasterAdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // 🔥 default FALSE

  const verifyMasterAdmin = async (supabaseUser: User) => {
    try {
      setLoading(true);

      const { data: role } = await supabase.rpc(
        'get_user_highest_role',
        { _user_id: supabaseUser.id }
      );

      if (role !== 'master_admin') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return;
      }

      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email || 'master',
        role: 'MASTER',
      });
    } catch (e) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        verifyMasterAdmin(data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          verifyMasterAdmin(newSession.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <MasterAdminAuthContext.Provider
      value={{
        user,
        session,
        loading,
        isMasterAdmin: user?.role === 'MASTER',
        signIn,
        signOut,
      }}
    >
      {children}
    </MasterAdminAuthContext.Provider>
  );
};

export const useMasterAdminAuth = () => {
  const ctx = useContext(MasterAdminAuthContext);
  if (!ctx) throw new Error('useMasterAdminAuth must be inside provider');
  return ctx;
};
