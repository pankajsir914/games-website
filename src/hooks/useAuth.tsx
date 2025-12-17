import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearPasswordChangeFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const checkPasswordChangeRequired = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('requires_password_change')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setRequiresPasswordChange(data.requires_password_change || false);
      }
    } catch (error) {
      console.error('Error checking password change requirement:', error);
    }
  };

  // Get device information for session tracking
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  // Enforce single device login
  const enforceSingleSession = async (userId: string, sessionToken: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      const { data, error } = await supabase.rpc('enforce_single_device_login', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_device_info: deviceInfo
      });

      if (error) {
        console.error('Failed to enforce single session:', error);
        return;
      }

      const result = data as { success: boolean; invalidated_sessions: number; message: string } | null;
      
      if (result && result.invalidated_sessions > 0) {
        toast({
          title: "Previous sessions logged out",
          description: `You were logged out from ${result.invalidated_sessions} other device(s).`,
        });
      }

      // Store session token in localStorage for validation
      localStorage.setItem('session_token', sessionToken);
    } catch (error) {
      console.error('Error enforcing single session:', error);
    }
  };

  // Validate current session
  const validateSession = useCallback(async () => {
    const sessionToken = localStorage.getItem('session_token');
    
    if (!sessionToken || !session) {
      return true; // Allow if no stored token
    }

    try {
      const { data, error } = await supabase.rpc('is_session_valid', {
        p_session_token: sessionToken
      });

      if (error) {
        console.error('Session validation error:', error);
        return true; // Allow on error
      }

      // If session is not valid, show warning and logout after delay
      if (!data) {
        toast({
          title: "Session Expired",
          description: "You have been logged in on another device. Logging out in 3 seconds...",
          variant: "destructive",
          duration: 5000,
        });
        
        // Delay logout to give user time to see message
        setTimeout(async () => {
          await signOut();
        }, 3000);
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return true; // Allow on error
    }
  }, [session]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Handle invalid refresh token
      if (error) {
        console.error('Session error:', error);
        localStorage.removeItem('session_token');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if password change is required using setTimeout to avoid deadlock
        setTimeout(() => {
          checkPasswordChangeRequired(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed - clearing session');
          localStorage.removeItem('session_token');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Handle signed out event
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_token');
          setSession(null);
          setUser(null);
          setRequiresPasswordChange(false);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Check if password change is required using setTimeout to avoid deadlock
          setTimeout(() => {
            checkPasswordChangeRequired(session.user.id);
          }, 0);
        } else {
          setRequiresPasswordChange(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Track failed login attempt
        try {
          await supabase.rpc('track_failed_login', {
            p_email: email,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        } catch (trackError) {
          console.error('Failed to track login attempt:', trackError);
        }
        throw error;
      }

      // Enforce single device login
      if (data.session && data.user) {
        await enforceSingleSession(data.user.id, data.session.access_token);
      }
      
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
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
      // Clear stored session token
      localStorage.removeItem('session_token');
      
      const { error } = await supabase.auth.signOut();
      
      // Ignore session missing errors - user is already logged out
      if (error && error.message !== 'Auth session missing!' && !error.message.includes('session_not_found')) {
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error: any) {
      // Only show error if it's not a session issue
      if (error.message !== 'Auth session missing!' && !error.message.includes('session_not_found')) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearPasswordChangeFlag = () => {
    setRequiresPasswordChange(false);
  };

  // Periodic session validation (reduced frequency to avoid aggressive checking)
  useEffect(() => {
    if (!session) return;

    // Set up periodic validation every 2 minutes instead of 30 seconds
    const intervalId = setInterval(() => {
      validateSession();
    }, 120000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [session, validateSession]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      requiresPasswordChange,
      signIn,
      signOut,
      resetPassword,
      clearPasswordChangeFlag,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
