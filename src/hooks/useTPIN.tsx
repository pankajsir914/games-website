import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TPINStatus {
  success: boolean;
  has_tpin: boolean;
  tpin_set_at?: string;
  is_admin: boolean;
  error?: string;
}

interface TPINVerifyResult {
  success: boolean;
  error?: string;
  remaining_attempts?: number;
  locked?: boolean;
  locked_until?: string;
  remaining_minutes?: number;
}

export const useTPIN = () => {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Check TPIN status
  const { data: tpinStatus, isLoading: isCheckingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['tpin-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_admin_tpin_status');
      if (error) throw error;
      return data as unknown as TPINStatus;
    },
    staleTime: 30000,
  });

  // Set TPIN mutation
  const setTPINMutation = useMutation({
    mutationFn: async (tpin: string) => {
      const { data, error } = await supabase.rpc('set_admin_tpin', { p_tpin: tpin });
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to set TPIN');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpin-status'] });
      toast({
        title: 'TPIN Set Successfully',
        description: 'Your TPIN has been configured. You will need it for sensitive actions.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Set TPIN',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify TPIN mutation
  const verifyTPINMutation = useMutation({
    mutationFn: async (tpin: string) => {
      const { data, error } = await supabase.rpc('verify_admin_tpin', { p_tpin: tpin });
      if (error) throw error;
      return data as unknown as TPINVerifyResult;
    },
    onError: (error: Error) => {
      toast({
        title: 'TPIN Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset TPIN (master admin only)
  const resetTPINMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const { data, error } = await supabase.rpc('reset_admin_tpin', { p_admin_id: adminId });
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset TPIN');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'TPIN Reset Successfully',
        description: 'The admin will need to set a new TPIN on their next login.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Reset TPIN',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Execute action with TPIN verification
  const executeWithTPIN = useCallback(async (action: () => Promise<void>, tpin: string): Promise<boolean> => {
    const result = await verifyTPINMutation.mutateAsync(tpin);
    
    if (result.success) {
      await action();
      return true;
    } else {
      toast({
        title: 'TPIN Verification Failed',
        description: result.error || 'Invalid TPIN',
        variant: 'destructive',
      });
      return false;
    }
  }, [verifyTPINMutation]);

  return {
    // Status
    hasTPIN: tpinStatus?.has_tpin ?? false,
    isAdmin: tpinStatus?.is_admin ?? false,
    needsTPINSetup: tpinStatus?.is_admin && !tpinStatus?.has_tpin,
    isCheckingStatus,
    tpinSetAt: tpinStatus?.tpin_set_at,
    
    // Actions
    setTPIN: setTPINMutation.mutate,
    verifyTPIN: verifyTPINMutation.mutateAsync,
    resetTPIN: resetTPINMutation.mutate,
    executeWithTPIN,
    refetchStatus,
    
    // Loading states
    isSettingTPIN: setTPINMutation.isPending,
    isVerifyingTPIN: verifyTPINMutation.isPending,
    isResettingTPIN: resetTPINMutation.isPending,
    
    // Pending action management
    pendingAction,
    setPendingAction,
  };
};