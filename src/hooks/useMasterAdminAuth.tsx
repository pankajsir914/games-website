import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface MasterAdminUser {
  id: string;
  username: string;
  role: 'MASTER' | 'ADMIN' | 'USER';
}

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  session: string | null; // JWT
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

  useEffect(() => {
    // Initialize from storage
    const storedToken = localStorage.getItem('master_admin_token');
    const storedUser = localStorage.getItem('master_admin_user');
    if (storedToken && storedUser) {
      setSession(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Login failed');
      }
      const body = await res.json();
      const { token, user } = body as { token: string; user: MasterAdminUser };
      if (!user || user.role !== 'MASTER') {
        throw new Error('Master Admin role required');
      }
      localStorage.setItem('master_admin_token', token);
      localStorage.setItem('master_admin_user', JSON.stringify(user));
      setSession(token);
      setUser(user);
      toast.success('Signed in as Master Admin');
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('master_admin_token');
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