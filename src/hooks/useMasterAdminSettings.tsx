import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PlatformSettings {
  platform_name: string;
  platform_url: string;
  support_email: string;
  admin_email: string;
  min_deposit_amount: number;
  max_deposit_amount: number;
  min_withdrawal_amount: number;
  max_withdrawal_amount: number;
  withdrawal_fee: number;
  commission_rate: number;
  auto_approve_deposits: boolean;
  auto_approve_withdrawals: boolean;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  session_timeout: number;
  max_concurrent_sessions: number;
  api_rate_limit: number;
  backup_frequency: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  security_alerts: boolean;
}

export const useMasterAdminSettings = () => {
  const queryClient = useQueryClient();

  const getSettings = useQuery({
    queryKey: ['master-admin-settings'],
    queryFn: async () => {
      // For now, return mock data since we haven't created a settings table
      const mockSettings: PlatformSettings = {
        platform_name: "GameVault Pro",
        platform_url: "https://gamevault.pro",
        support_email: "support@gamevault.pro",
        admin_email: "admin@gamevault.pro",
        min_deposit_amount: 100,
        max_deposit_amount: 100000,
        min_withdrawal_amount: 500,
        max_withdrawal_amount: 50000,
        withdrawal_fee: 50,
        commission_rate: 0.05,
        auto_approve_deposits: false,
        auto_approve_withdrawals: false,
        maintenance_mode: false,
        registration_enabled: true,
        session_timeout: 30,
        max_concurrent_sessions: 3,
        api_rate_limit: 1000,
        backup_frequency: "daily",
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        security_alerts: true,
      };

      return mockSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<PlatformSettings>) => {
      // Simulate update for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, settings };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-settings'] });
      toast({
        title: "Settings updated",
        description: "Platform settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings: getSettings.data,
    isLoading: getSettings.isLoading,
    error: getSettings.error,
    refetch: getSettings.refetch,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};