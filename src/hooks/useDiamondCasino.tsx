import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiamondTable {
  id: string;
  name: string;
  status: string;
  players: number;
  data: any;
}

interface DiamondBet {
  id: string;
  table_id: string;
  table_name: string;
  bet_amount: number;
  bet_type: string;
  odds: number;
  status: string;
  payout_amount?: number;
  created_at: string;
}

export const useDiamondCasino = () => {
  const [liveTables, setLiveTables] = useState<DiamondTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiamondTable | null>(null);
  const [bets, setBets] = useState<DiamondBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<any>(null);
  const { toast } = useToast();

  // Fetch live tables
  const fetchLiveTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-tables' }
      });

      if (error) throw error;

      if (data?.success && data?.data?.tables) {
        setLiveTables(data.data.tables);
      }
    } catch (error) {
      console.error('Error fetching live tables:', error);
      toast({
        title: "Error",
        description: "Failed to load live casino tables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch table details
  const fetchTableDetails = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-table', tableId }
      });

      if (error) throw error;

      if (data?.success) {
        setSelectedTable(data.data);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
    }
  };

  // Fetch table odds
  const fetchOdds = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-odds', tableId }
      });

      if (error) throw error;

      if (data?.success) {
        setOdds(data.data);
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
    }
  };

  // Place bet
  const placeBet = async (betData: {
    tableId: string;
    tableName: string;
    amount: number;
    betType: string;
    odds: number;
    roundId?: string;
  }) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to place bets');
      }

      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { 
          action: 'place-bet', 
          betData 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Bet Placed!",
          description: `You bet ₹${betData.amount} on ${betData.betType}`,
        });

        fetchUserBets();
        return data.bet;
      }
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's bets
  const fetchUserBets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('diamond_casino_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setBets(data || []);
    } catch (error) {
      console.error('Error fetching bets:', error);
    }
  };

  // Auto-refresh tables every 3 seconds
  useEffect(() => {
    fetchLiveTables();
    fetchUserBets();

    const interval = setInterval(() => {
      fetchLiveTables();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time bet updates
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const channel = supabase
        .channel('diamond-casino-bets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'diamond_casino_bets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUserBets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  return {
    liveTables,
    selectedTable,
    odds,
    bets,
    loading,
    fetchLiveTables,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    setSelectedTable
  };
};
