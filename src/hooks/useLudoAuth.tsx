import { useState, useEffect, createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';

interface LudoUser {
  id: string;
  username: string;
  walletBalance: number;
}

interface LudoAuthContextType {
  user: LudoUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const LudoAuthContext = createContext<LudoAuthContextType | null>(null);

export const useLudoAuth = () => {
  const context = useContext(LudoAuthContext);
  if (!context) {
    // Provide a default implementation
    const [user, setUser] = useState<LudoUser | null>(null);
    const [loading, setLoading] = useState(false);

    const login = async (username: string, password: string) => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store token
        localStorage.setItem('ludo_token', data.token);
        
        // Set user
        setUser(data.user);

        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.username}`,
        });
      } catch (error: any) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    };

    const logout = () => {
      localStorage.removeItem('ludo_token');
      setUser(null);
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    };

    const refreshUser = async () => {
      const token = localStorage.getItem('ludo_token');
      if (!token) return;

      try {
        const response = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(prev => prev ? { ...prev, walletBalance: data.balance } : null);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };

    // Check for existing token on mount
    useEffect(() => {
      const token = localStorage.getItem('ludo_token');
      if (token) {
        // Verify token by fetching user data
        refreshUser();
      }
    }, []);

    return {
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
      refreshUser,
    };
  }
  return context;
};

export const LudoAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useLudoAuth();
  
  return (
    <LudoAuthContext.Provider value={auth}>
      {children}
    </LudoAuthContext.Provider>
  );
};