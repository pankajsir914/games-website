import { useEffect, useState, useCallback } from 'react';
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
    ipWhitelisted: true, // Default to true since IP whitelist not implemented
    rateLimited: true, // Default to true (not rate limited)
    inputValidated: true
  });
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Validate admin session by checking if user is authenticated and has admin role
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return false;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['master_admin', 'admin', 'moderator']);

      if (error) {
        console.error('Role check error:', error);
        return false;
      }

      return roles && roles.length > 0;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, []);

  // Check IP whitelist - simplified version (always returns true)
  const checkIPWhitelist = useCallback(async (): Promise<boolean> => {
    // IP whitelisting not implemented - always allow
    return true;
  }, []);

  // Check rate limits - simplified version
  const checkRateLimit = useCallback(async (endpoint: string): Promise<boolean> => {
    // Rate limiting can be implemented later
    // For now, always return true (not rate limited)
    return true;
  }, []);

  // Validate input - basic client-side validation
  const validateInput = useCallback(async (
    input: string, 
    inputType: 'general' | 'email' | 'sql' | 'html' = 'general',
    maxLength: number = 255
  ): Promise<string | null> => {
    try {
      // Basic validation
      if (!input || input.length > maxLength) {
        toast({
          title: "Input Validation Failed",
          description: `Input exceeds maximum length of ${maxLength} characters`,
          variant: "destructive"
        });
        return null;
      }

      // Basic XSS prevention - remove script tags
      let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove common SQL injection patterns
      if (inputType === 'sql') {
        const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi;
        if (sqlPatterns.test(input)) {
          toast({
            title: "Input Validation Failed",
            description: "Input contains restricted SQL keywords",
            variant: "destructive"
          });
          return null;
        }
      }

      return sanitized;
    } catch (error: any) {
      toast({
        title: "Security Validation Error",
        description: error.message || "Input validation failed",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Comprehensive security validation
  const performSecurityCheck = useCallback(async (endpoint?: string) => {
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

      return sessionValid && ipWhitelisted && rateLimited;
    } catch (error) {
      console.error('Security check failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validateSession, checkIPWhitelist, checkRateLimit]);

  // Auto-validate session on mount and periodically
  useEffect(() => {
    performSecurityCheck();
    
    // Periodic security checks every 5 minutes
    const interval = setInterval(() => {
      performSecurityCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [performSecurityCheck]);

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