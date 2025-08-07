import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MasterAdminUser {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: string | null;
  loading: boolean;
  isMasterAdmin: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MasterAdminAuthContext = createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MasterAdminUser | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const storedSession = localStorage.getItem('master_admin_session');
    const storedUser = localStorage.getItem('master_admin_user');
    
    if (storedSession && storedUser) {
      setSession(storedSession);
      setUser(JSON.parse(storedUser));
      setIsMasterAdmin(true);
    }
    
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting manual login with:', username);
      
      // For now, use hardcoded credentials until migration is approved
      if (username === 'masteradmin' && password === 'Admin@2024!') {
        const mockUser: MasterAdminUser = {
          id: 'master-admin-001',
          username: 'masteradmin',
          email: 'masteradmin@system.local',
          created_at: new Date().toISOString()
        };

        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store session and user data
        localStorage.setItem('master_admin_session', sessionToken);
        localStorage.setItem('master_admin_user', JSON.stringify(mockUser));
        
        setSession(sessionToken);
        setUser(mockUser);
        setIsMasterAdmin(true);
        
        toast.success('Successfully signed in as Master Admin');
      } else {
        toast.error('Invalid credentials');
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear local storage
      localStorage.removeItem('master_admin_session');
      localStorage.removeItem('master_admin_user');
      
      setUser(null);
      setSession(null);
      setIsMasterAdmin(false);
      
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local data even if logout call fails
      localStorage.removeItem('master_admin_session');
      localStorage.removeItem('master_admin_user');
      setUser(null);
      setSession(null);
      setIsMasterAdmin(false);
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