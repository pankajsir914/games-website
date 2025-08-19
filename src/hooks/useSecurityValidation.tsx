import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityCheck {
  sessionValid: boolean;
  ipWhitelisted: boolean;
  rateLimited: boolean;
  inputValidated: boolean;
}

export const useSecurityValidation = () => {
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck>({
    sessionValid: false,
    ipWhitelisted: false,
    rateLimited: false,
    inputValidated: true
  });
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Validate admin session
  const validateSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_session');
      if (error) {
        console.error('Session validation error:', error);
        return false;
      }
      return data === true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  // Check IP whitelist
  const checkIPWhitelist = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_admin_ip_whitelist');
      if (error) {
        console.error('IP whitelist check error:', error);
        return true; // Default to allow if check fails
      }
      return data === true;
    } catch (error) {
      console.error('IP whitelist check failed:', error);
      return true;
    }
  };

  // Check rate limits
  const checkRateLimit = async (endpoint: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_enhanced_rate_limit', {
        p_endpoint: endpoint,
        p_max_attempts: 10,
        p_window_minutes: 60,
        p_progressive_penalty: true
      });
      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Default to allow if check fails
      }
      return data === true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true;
    }
  };

  // Validate input with server-side sanitization
  const validateInput = async (
    input: string, 
    inputType: 'general' | 'email' | 'sql' | 'html' = 'general',
    maxLength: number = 255
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_input', {
        p_input: input,
        p_input_type: inputType,
        p_max_length: maxLength
      });
      
      if (error) {
        toast({
          title: "Input Validation Failed",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: "Security Validation Error",
        description: error.message || "Input contains potentially dangerous content",
        variant: "destructive"
      });
      return null;
    }
  };

  // Comprehensive security validation
  const performSecurityCheck = async (endpoint?: string) => {
    setIsValidating(true);
    
    try {
      const [sessionValid, ipWhitelisted, rateLimited] = await Promise.all([
        validateSession(),
        checkIPWhitelist(),
        endpoint ? checkRateLimit(endpoint) : Promise.resolve(true)
      ]);

      const newSecurityCheck = {
        sessionValid,
        ipWhitelisted,
        rateLimited,
        inputValidated: true
      };

      setSecurityCheck(newSecurityCheck);

      // Handle security failures
      if (!sessionValid) {
        toast({
          title: "Session Invalid",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
      }

      if (!ipWhitelisted) {
        toast({
          title: "Access Restricted",
          description: "Your IP address is not authorized for admin access.",
          variant: "destructive"
        });
      }

      if (!rateLimited) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait before trying again.",
          variant: "destructive"
        });
      }

      return sessionValid && ipWhitelisted && rateLimited;
    } catch (error) {
      console.error('Security check failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate session on mount and periodically
  useEffect(() => {
    performSecurityCheck();
    
    // Periodic security checks every 5 minutes
    const interval = setInterval(() => {
      performSecurityCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    securityCheck,
    isValidating,
    validateSession,
    checkIPWhitelist,
    checkRateLimit,
    validateInput,
    performSecurityCheck
  };
};