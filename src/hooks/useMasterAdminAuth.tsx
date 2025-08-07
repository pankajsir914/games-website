import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MasterAdminAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isMasterAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MasterAdminAuthContext = createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  const checkMasterAdminRole = async (userId: string) => {
    try {
      console.log('Checking master admin role for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'master_admin')
        .single();

      console.log('Role check response:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking master admin role:', error);
        return false;
      }

      const isMaster = !!data;
      console.log('Is master admin result:', isMaster);
      return isMaster;
    } catch (error) {
      console.error('Error checking master admin role:', error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const isMaster = await checkMasterAdminRole(session.user.id);
        setIsMasterAdmin(isMaster);
      } else {
        setIsMasterAdmin(false);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const isMaster = await checkMasterAdminRole(session.user.id);
          setIsMasterAdmin(isMaster);
        } else {
          setIsMasterAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting to sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase auth response:', { data, error });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      // Check if user has master admin role
      if (data.user) {
        console.log('User authenticated, checking master admin role...');
        const isMaster = await checkMasterAdminRole(data.user.id);
        console.log('Is master admin:', isMaster);
        
        if (!isMaster) {
          console.log('User is not master admin, signing out...');
          await supabase.auth.signOut();
          throw new Error('Access denied. Master Admin privileges required.');
        }
        setIsMasterAdmin(true);
      }
      
      toast({
        title: "Master Admin Access Granted",
        description: "Welcome to the Master Admin Console.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsMasterAdmin(false);
      
      toast({
        title: "Signed Out",
        description: "Master Admin session ended.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MasterAdminAuthContext.Provider value={{
      user,
      session,
      loading,
      isMasterAdmin,
      signIn,
      signOut,
    }}>
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