
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

type GameType = 'ludo' | 'aviator' | 'casino' | 'color_prediction';
type TransactionType = 'credit' | 'debit';

interface Wallet {
  id: string;
  user_id: string;
  current_balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  reason: string;
  game_type?: GameType;
  game_session_id?: string;
  balance_after: number;
  created_at: string;
}

interface WalletUpdateResponse {
  success: boolean;
  new_balance: number;
  transaction_amount: number;
  transaction_type: TransactionType;
}

export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!user?.id,
  });

  // Fetch wallet transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user?.id,
  });

  // Update wallet balance mutation
  const updateBalance = useMutation({
    mutationFn: async ({
      amount,
      type,
      reason,
      gameType,
      gameSessionId
    }: {
      amount: number;
      type: TransactionType;
      reason: string;
      gameType?: GameType;
      gameSessionId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_type: type,
        p_reason: reason,
        p_game_type: gameType || null,
        p_game_session_id: gameSessionId || null,
      });

      if (error) throw error;
      
      return data as unknown as WalletUpdateResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', user?.id] });
      
      toast({
        title: "Wallet Updated",
        description: `Balance ${data.transaction_type === 'credit' ? 'credited' : 'debited'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Lock/unlock balance mutation
  const lockBalance = useMutation({
    mutationFn: async ({
      amount,
      lock = true
    }: {
      amount: number;
      lock?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('lock_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_lock: lock,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Lock Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    wallet,
    transactions,
    walletLoading,
    transactionsLoading,
    walletError,
    updateBalance: updateBalance.mutate,
    lockBalance: lockBalance.mutate,
    isUpdating: updateBalance.isPending || lockBalance.isPending,
  };
};
