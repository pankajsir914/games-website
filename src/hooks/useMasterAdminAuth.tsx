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
    let timeoutId: NodeJS.Timeout;
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Authentication check timed out');
        setLoading(false);
        setUser(null);
        setSession(null);
      }
    }, 10000); // 10 second timeout
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Defer any RPC calls to avoid deadlocks
      if (newSession?.user) {
        setTimeout(() => verifyAndLoadMasterAdmin(newSession.user), 0);
      } else {
        setUser(null);
        setLoading(false);  // Clear loading state when no session
        clearTimeout(timeoutId);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        // Defer initial verification
        setTimeout(() => verifyAndLoadMasterAdmin(data.session!.user!), 0);
      } else {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setLoading(false);
      setUser(null);
      setSession(null);
      clearTimeout(timeoutId);
    });

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const verifyAndLoadMasterAdmin = async (supabaseUser: User) => {
    try {
      // Check highest role via RPC (SECURITY DEFINER function already exists)
      const { data: roleText, error } = await supabase.rpc('get_user_highest_role', { _user_id: supabaseUser.id });
      if (error) {
        console.error('Role verification failed:', error);
        setLoading(false);  // Make sure to clear loading state on error
        setUser(null);
        return;
      }

      if (roleText !== 'master_admin') {
        // Not a master admin; clear session for master admin context only
        setUser(null);
        setSession(null);
        console.log('User is not master admin, role:', roleText);
        
        // Log unauthorized access attempt
        setTimeout(() => {
          supabase.rpc('log_admin_activity', {
            p_action_type: 'unauthorized_master_admin_access',
            p_target_type: 'auth',
            p_details: { 
              user_id: supabaseUser.id, 
              email: supabaseUser.email,
              actual_role: roleText,
              timestamp: new Date().toISOString()
            }
          });
        }, 0);
      } else {
        // Map to existing shape (keep role as MASTER for compatibility across app)
        setUser({ id: supabaseUser.id, username: supabaseUser.email || 'master', role: 'MASTER' });
        
        // Log successful master admin access
        setTimeout(() => {
          supabase.rpc('log_admin_activity', {
            p_action_type: 'master_admin_login_success',
            p_target_type: 'auth',
            p_details: { 
              user_id: supabaseUser.id,
              email: supabaseUser.email,
              timestamp: new Date().toISOString()
            }
          });
        }, 0);
        
        console.log('Master admin verified successfully');
      }
    } catch (e: any) {
      console.error('Master admin verification error:', e.message);
      setUser(null);
      setSession(null);
      toast.error('Failed to verify master admin access');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Optional rate limiting pre-check (non-blocking)
      const { data: canProceed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_endpoint: 'master_admin_login',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

      if (rateLimitError) {
        console.warn('Rate limit check failed:', rateLimitError);
        // Proceed with login attempt regardless of rate limit check issues
      } else if (canProceed === false) {
        console.warn('Rate limit reached for master admin login; proceeding anyway.');
        toast.warning('Many login attempts detected. We’ll still verify your credentials.');
      }


      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        // Log failed attempt
        setTimeout(() => {
          supabase.rpc('log_admin_activity', {
            p_action_type: 'master_admin_login_failed',
            p_target_type: 'auth',
            p_details: { email, error: error.message, timestamp: new Date().toISOString() }
          });
        }, 0);
        
        throw error;
      }

      // onAuthStateChange will finish loading the user and role
      // Success will be logged in verifyAndLoadMasterAdmin
    } catch (e: any) {
      const errorMessage = e.message || 'Login failed';
      console.error('Master admin sign in error:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      // loading will be cleared by verifyAndLoadMasterAdmin or error handling
    }
  };

  const signOut = async () => {
    try {
      // Log master admin logout
      if (user) {
        setTimeout(() => {
          supabase.rpc('log_admin_activity', {
            p_action_type: 'master_admin_logout',
            p_target_type: 'auth',
            p_details: { 
              user_id: user.id,
              email: user.username,
              timestamp: new Date().toISOString()
            }
          });
        }, 0);
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed');
    }
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
