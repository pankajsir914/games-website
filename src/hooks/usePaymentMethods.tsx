import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'bank_account' | 'upi';
  is_primary: boolean;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  nickname?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading, error } = useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (method: Partial<PaymentMethod>) => {
      if (!user) throw new Error('User not authenticated');

      // If this is being set as primary, unset other primary methods first
      if (method.is_primary) {
        await supabase
          .from('user_payment_methods')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('user_payment_methods')
        .insert({
          user_id: user.id,
          method_type: method.method_type!,
          is_primary: method.is_primary || false,
          bank_name: method.bank_name,
          account_number: method.account_number,
          ifsc_code: method.ifsc_code,
          account_holder_name: method.account_holder_name,
          upi_id: method.upi_id,
          nickname: method.nickname,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({
        title: 'Payment Method Added',
        description: 'Your payment method has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add payment method. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding payment method:', error);
    },
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      // If setting as primary, unset other primary methods first
      if (updates.is_primary) {
        await supabase
          .from('user_payment_methods')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('user_payment_methods')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({
        title: 'Payment Method Updated',
        description: 'Your payment method has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update payment method. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating payment method:', error);
    },
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({
        title: 'Payment Method Deleted',
        description: 'Your payment method has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting payment method:', error);
    },
  });

  return {
    paymentMethods: paymentMethods || [],
    isLoading,
    error,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
};