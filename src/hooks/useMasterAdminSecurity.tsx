import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SecurityData {
  security_score: number;
  active_alerts: number;
  failed_logins_today: number;
  blocked_ips: number;
  suspicious_activities: {
    user_id: string;
    activity_type: string;
    risk_level: string;
    detected_at: string;
    description: string;
  }[];
  recent_alerts: {
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    created_at: string;
    is_resolved: boolean;
  }[];
  admin_activity_logs: {
    id: string;
    admin_id: string;
    action_type: string;
    target_type: string;
    details: any;
    created_at: string;
  }[];
  system_health: {
    cpu_usage: number;
    memory_usage: number;
    database_connections: number;
    response_time: number;
  };
}

export const useMasterAdminSecurity = () => {
  const queryClient = useQueryClient();

  const getSecurityData = useQuery({
    queryKey: ['master-admin-security'],
    queryFn: async () => {
      // Mock data for now
      const mockData: SecurityData = {
        security_score: 85,
        active_alerts: 3,
        failed_logins_today: 12,
        blocked_ips: 5,
        suspicious_activities: [
          {
            user_id: '1',
            activity_type: 'rapid_betting',
            risk_level: 'medium',
            detected_at: '2024-01-20T14:00:00Z',
            description: 'User placed 50+ bets in 5 minutes'
          }
        ],
        recent_alerts: [
          {
            id: '1',
            alert_type: 'security',
            severity: 'high',
            title: 'Multiple failed login attempts',
            description: 'IP 192.168.1.100 attempted to login 10 times',
            created_at: '2024-01-20T13:30:00Z',
            is_resolved: false
          }
        ],
        admin_activity_logs: [
          {
            id: '1',
            admin_id: '1',
            action_type: 'user_block',
            target_type: 'user',
            details: { user_id: '123', reason: 'Suspicious activity' },
            created_at: '2024-01-20T12:00:00Z'
          }
        ],
        system_health: {
          cpu_usage: 45,
          memory_usage: 62,
          database_connections: 78,
          response_time: 150
        }
      };
      
      return mockData;
    },
    refetchInterval: 20000, // Refresh every 20 seconds
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      const { data, error } = await supabase
        .from('admin_alerts')
        .update({ 
          is_resolved: true,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-security'] });
      toast({
        title: "Alert resolved",
        description: "The security alert has been marked as resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resolution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAlert = useMutation({
    mutationFn: async ({ 
      alertType, 
      severity, 
      title, 
      description 
    }: { 
      alertType: string; 
      severity: string; 
      title: string; 
      description: string 
    }) => {
      const { data, error } = await supabase.rpc('create_admin_alert', {
        p_alert_type: alertType,
        p_severity: severity,
        p_title: title,
        p_description: description
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-security'] });
      toast({
        title: "Alert created",
        description: "New security alert has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Alert creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    securityData: getSecurityData.data,
    isLoading: getSecurityData.isLoading,
    error: getSecurityData.error,
    refetch: getSecurityData.refetch,
    resolveAlert: resolveAlert.mutate,
    createAlert: createAlert.mutate,
    isProcessing: resolveAlert.isPending || createAlert.isPending,
  };
};