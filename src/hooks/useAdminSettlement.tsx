import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PendingBet {
  id: string;
  user_id: string;
  table_id: string;
  table_name: string | null;
  bet_amount: number;
  bet_type: string;
  odds: number | null;
  round_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export const useAdminSettlement = () => {
  const queryClient = useQueryClient();

  // Fetch pending bets
  const pendingBetsQuery = useQuery({
    queryKey: ['admin-pending-bets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diamond_casino_bets')
        .select(`
          id,
          user_id,
          table_id,
          table_name,
          bet_amount,
          bet_type,
          odds,
          round_id,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each bet
      const betsWithUsers = await Promise.all(
        (data || []).map(async (bet) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', bet.user_id)
            .single();

          return {
            ...bet,
            user_email: profile?.email || 'N/A',
            user_name: profile?.full_name || 'N/A',
          } as PendingBet;
        })
      );

      return betsWithUsers;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Group bets by table_id
  const groupedBets = pendingBetsQuery.data?.reduce((acc, bet) => {
    if (!acc[bet.table_id]) {
      acc[bet.table_id] = {
        table_id: bet.table_id,
        table_name: bet.table_name || bet.table_id,
        bets: [],
        total_amount: 0,
      };
    }
    acc[bet.table_id].bets.push(bet);
    acc[bet.table_id].total_amount += bet.bet_amount;
    return acc;
  }, {} as Record<string, { table_id: string; table_name: string; bets: PendingBet[]; total_amount: number }>) || {};

  // Settle bets for a specific table
  const settleBets = useMutation({
    mutationFn: async ({ tableId, roundId }: { tableId: string; roundId?: string }) => {
      const requestBody: any = { 
        action: "process-bets", 
        tableId 
      };
      
      if (roundId) {
        requestBody.mid = roundId.toString();
      }

      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { 
        body: requestBody
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-bets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      
      if (data?.success) {
        toast({
          title: "Bets Settled Successfully",
          description: `Processed ${data.processed || 0} bet(s). ${data.won || 0} won, ${data.lost || 0} lost.`,
        });
      } else {
        toast({
          title: "Settlement Failed",
          description: data?.error || "No result available for settlement",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Settlement Error",
        description: error.message || "Failed to settle bets",
        variant: "destructive",
      });
    },
  });

  // Settle individual bet manually
  const settleIndividualBet = useMutation({
    mutationFn: async ({ betId, status, payout }: { betId: string; status: 'won' | 'lost'; payout?: number }) => {
      const { data, error } = await supabase
        .from('diamond_casino_bets')
        .update({
          status,
          payout_amount: payout || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', betId)
        .select()
        .single();

      if (error) throw error;

      // If bet won, credit user wallet
      if (status === 'won' && payout) {
        const { data: bet } = await supabase
          .from('diamond_casino_bets')
          .select('user_id, bet_amount')
          .eq('id', betId)
          .single();

        if (bet) {
          const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: bet.user_id,
            p_amount: payout,
            p_type: 'credit',
            p_reason: `Bet settlement - ${betId}`,
            p_game_type: 'casino',
            p_game_session_id: null,
          });

          if (walletError) {
            console.error('Wallet credit error:', walletError);
            // Don't throw - bet is already updated
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-bets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      toast({
        title: "Bet Settled",
        description: "Bet has been settled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Settlement Error",
        description: error.message || "Failed to settle bet",
        variant: "destructive",
      });
    },
  });

  return {
    pendingBets: pendingBetsQuery.data || [],
    groupedBets: Object.values(groupedBets),
    isLoading: pendingBetsQuery.isLoading,
    error: pendingBetsQuery.error,
    refetch: pendingBetsQuery.refetch,
    settleBets: settleBets.mutate,
    isSettling: settleBets.isPending,
    settleIndividualBet: settleIndividualBet.mutate,
    isSettlingIndividual: settleIndividualBet.isPending,
  };
};

