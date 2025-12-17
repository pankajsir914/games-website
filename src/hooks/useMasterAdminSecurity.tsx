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
      // Get recent alerts
      const { data: alerts } = await supabase
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get admin activity logs
      const { data: activityLogs } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Count active alerts
      const { count: activeAlerts } = await supabase
        .from('admin_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      return {
        security_score: 85, // Calculate based on various factors
        active_alerts: activeAlerts || 0,
        failed_logins_today: 0, // Would need auth logging
        blocked_ips: 0, // Would need IP blocking system
        suspicious_activities: [], // Would need to analyze betting patterns
        recent_alerts: alerts?.map(alert => ({
          id: alert.id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          created_at: alert.created_at,
          is_resolved: alert.is_resolved
        })) || [],
        admin_activity_logs: activityLogs?.map(log => ({
          id: log.id,
          admin_id: log.admin_id,
          action_type: log.action_type,
          target_type: log.target_type,
          details: log.details,
          created_at: log.created_at
        })) || [],
        system_health: {
          cpu_usage: 45,
          memory_usage: 62,
          database_connections: 78,
          response_time: 150
        }
      } as SecurityData;
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
      const { data, error } = await supabase
        .from('admin_alerts')
        .insert({
          alert_type: alertType,
          severity: severity,
          title: title,
          description: description
        })
        .select()
        .single();

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