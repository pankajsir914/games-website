import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiamondTable {
  id: string;
  name: string;
  status: string;
  players: number;
  data: any;
  imageUrl?: string;
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
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [resultHistory, setResultHistory] = useState<any[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const { toast } = useToast();

  // Fetch live tables
  const fetchLiveTables = async () => {
    try {
      setLoading(true);
      console.log('🎰 Fetching live casino tables...');
      
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-tables' }
      });

      console.log('📡 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from casino API');
      }

      if (!data.success) {
        throw new Error(data.error || 'Casino API request failed');
      }

      if (data?.data?.tables && data.data.tables.length > 0) {
        console.log(`✅ Found ${data.data.tables.length} live tables`);
        // Process image URLs through proxy
        const tablesWithProxyImages = data.data.tables.map((table: any) => ({
          ...table,
          imageUrl: table.imageUrl ? 
            `https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/diamond-casino-proxy?image=${encodeURIComponent(table.imageUrl)}` 
            : undefined
        }));
        setLiveTables(tablesWithProxyImages);
      } else {
        console.warn('⚠️ No tables in API response, trying database fallback...');
        
        // Fallback to database cache
        const { data: cachedTables } = await supabase
          .from('diamond_casino_tables')
          .select('*')
          .eq('status', 'active')
          .order('last_updated', { ascending: false });
        
        if (cachedTables && cachedTables.length > 0) {
          console.log(`✅ Found ${cachedTables.length} cached tables`);
          const tables = cachedTables.map(ct => ({
            id: ct.table_id,
            name: ct.table_name,
            status: ct.status,
            players: ct.player_count,
            data: ct.table_data,
            imageUrl: (ct.table_data as any)?.imageUrl
          }));
          setLiveTables(tables);
        } else {
          console.warn('⚠️ No cached tables available');
          setLiveTables([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching live tables:', error);
      
      // Try database fallback on error
      try {
        const { data: cachedTables } = await supabase
          .from('diamond_casino_tables')
          .select('*')
          .eq('status', 'active')
          .order('last_updated', { ascending: false });
        
        if (cachedTables && cachedTables.length > 0) {
          console.log(`✅ Using ${cachedTables.length} cached tables after error`);
          const tables = cachedTables.map(ct => ({
            id: ct.table_id,
            name: ct.table_name,
            status: ct.status,
            players: ct.player_count,
            data: ct.table_data,
            imageUrl: (ct.table_data as any)?.imageUrl
          }));
          setLiveTables(tables);
          
          toast({
            title: "Using Cached Data",
            description: "Live connection unavailable. Showing last known tables.",
            variant: "default"
          });
        } else {
          throw error; // Re-throw if no cache available
        }
      } catch (fallbackError) {
        toast({
          title: "Casino Connection Error",
          description: error.message || "Failed to load live casino tables. Please check your API configuration.",
          variant: "destructive"
        });
        setLiveTables([]);
      }
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

      if (data?.success && data?.data?.data) {
        // Update selected table with detailed info
        setSelectedTable(prev => prev ? {
          ...prev,
          data: {
            ...prev.data,
            ...data.data.data
          }
        } : prev);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
    }
  };

  // Fetch table odds
  const fetchOdds = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-table', tableId }
      });

      if (error) throw error;

      if (data?.success && data?.data?.data?.sub) {
        // Transform the API response to our format
        const bets = data.data.data.sub.map((bet: any) => ({
          type: bet.nat,
          odds: bet.b,
          status: bet.gstatus,
          min: bet.min,
          max: bet.max,
          sid: bet.sid
        }));
        
        setOdds({ 
          bets,
          rawData: data.data.data 
        });
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

  // Initial load only
  useEffect(() => {
    fetchLiveTables();
    fetchUserBets();
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

  // Fetch stream URL
  const fetchStreamUrl = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-stream-url', tableId }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data?.data?.tv_url) {
        const streamUrl = data.data.data.tv_url;
        setStreamUrls(prev => ({ ...prev, [tableId]: streamUrl }));
        return streamUrl;
      }
    } catch (error) {
      console.error('Error fetching stream URL:', error);
    }
  };

  // Fetch current result
  const fetchCurrentResult = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-result', tableId }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data?.data) {
        const resultData = {
          tableName: data.data.data.res1?.cname || '',
          latestResult: data.data.data.res?.[0] || null,
          results: data.data.data.res || []
        };
        setCurrentResult(resultData);
        setResults(prev => ({ ...prev, [tableId]: resultData }));
      }
    } catch (error) {
      console.error('Error fetching result:', error);
    }
  };

  // Fetch result history
  const fetchResultHistory = async (tableId: string, date?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-result-history', tableId, date }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data?.data) {
        setResultHistory(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching result history:', error);
    }
  };

  return {
    liveTables,
    selectedTable,
    odds,
    bets,
    loading,
    streamUrls,
    results,
    resultHistory,
    currentResult,
    fetchLiveTables,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    setSelectedTable,
    fetchStreamUrl,
    fetchCurrentResult,
    fetchResultHistory
  };
};
