import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MasterAdminUser {
  id: string;
  email: string;
}

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: string | null;
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
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session || null;
      if (currentSession) {
        setSession(currentSession.access_token);
        setUser({ id: currentSession.user.id, email: currentSession.user.email || '' });
        // Check role
        const { data: roleData } = await supabase.rpc('get_user_highest_role', { _user_id: currentSession.user.id });
        setIsMasterAdmin(roleData === 'master_admin');
      }
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (sess) {
        setSession(sess.access_token);
        setUser({ id: sess.user.id, email: sess.user.email || '' });
        const { data: roleData } = await supabase.rpc('get_user_highest_role', { _user_id: sess.user.id });
        setIsMasterAdmin(roleData === 'master_admin');
      } else {
        setSession(null);
        setUser(null);
        setIsMasterAdmin(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      throw error;
    }
    const user = data.user;
    const { data: roleData } = await supabase.rpc('get_user_highest_role', { _user_id: user.id });
    if (roleData !== 'master_admin') {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error('Master admin role required');
      throw new Error('Not a master admin');
    }
    toast.success('Signed in as Master Admin');
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsMasterAdmin(false);
  };

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