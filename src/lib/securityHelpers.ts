import { supabase } from '@/integrations/supabase/client';

/**
 * Log a security event to the audit log
 */
export const logSecurityEvent = async (
  action: string,
  resourceType?: string,
  resourceId?: string,
  requestData?: Record<string, any>,
  responseStatus: number = 200
) => {
  try {
    await supabase.rpc('log_security_event', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_request_data: requestData,
      p_response_status: responseStatus
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Check if user has exceeded rate limit
 */
export const checkRateLimit = async (
  endpoint: string,
  maxRequests: number = 100,
  windowMinutes: number = 1
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id || null,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow on error to prevent blocking legitimate users
  }
};

/**
 * Validate and sanitize user input
 */
export const validateInput = async (
  input: string,
  inputType: 'general' | 'email' | 'sql' | 'html' = 'general',
  maxLength: number = 1000
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('validate_input', {
      p_input: input,
      p_input_type: inputType,
      p_max_length: maxLength
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Input validation failed:', error);
    return null;
  }
};

/**
 * Track failed login attempt
 */
export const trackFailedLogin = async (email: string) => {
  try {
    await supabase.rpc('track_failed_login', {
      p_email: email,
      p_ip_address: null, // IP detection would need backend
      p_user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to track login attempt:', error);
  }
};

/**
 * Check if IP is whitelisted for admin access
 */
export const checkIPWhitelist = async (ipAddress: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_ip_whitelist', {
      p_ip_address: ipAddress
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('IP whitelist check failed:', error);
    return true; // Allow on error
  }
};

/**
 * Get security audit logs (admin only)
 */
export const getSecurityAuditLogs = async (limit: number = 100) => {
  try {
    // Using any to bypass type check until types are regenerated
    const { data, error } = await (supabase as any)
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
};

/**
 * Get failed login attempts (admin only) - Will work after types regeneration
 */
export const getFailedLoginAttempts = async (hours: number = 24) => {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await (supabase as any)
      .from('failed_login_attempts')
      .select('*')
      .gte('attempted_at', since)
      .order('attempted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch login attempts:', error);
    return [];
  }
};

/**
 * Get active user sessions (will work after types regeneration)
 */
export const getActiveSessions = async () => {
  try {
    const { data, error } = await (supabase as any)
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
};

/**
 * Revoke a user session (will work after types regeneration)
 */
export const revokeSession = async (sessionId: string) => {
  try {
    const { error } = await (supabase as any)
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to revoke session:', error);
    return false;
  }
};
