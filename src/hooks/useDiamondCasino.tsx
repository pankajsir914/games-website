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
        // Proxy images through edge function to bypass CORS
        const tablesWithProxiedImages = data.data.tables.map((table: any) => {
          // Extract just the filename from the imageUrl
          let imgPath = '';
          if (table.imageUrl) {
            const parts = table.imageUrl.split('/');
            imgPath = parts[parts.length - 1]; // Get just the filename
          }
          return {
            ...table,
            imageUrl: imgPath ? `https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/diamond-casino-proxy?image=${encodeURIComponent(imgPath)}` : undefined
          };
        });
        setLiveTables(tablesWithProxiedImages);
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

  // Fetch table odds - extract from result data since dedicated odds endpoint returns 404
  const fetchOdds = async (tableId: string) => {
    try {
      // First try the odds endpoint
      const { data: oddsResponse } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-odds', tableId }
      });

      console.log('📊 Odds API response:', oddsResponse);

      let extractedBets: any[] = [];
      
      // Try to extract from odds response
      const oddsData = oddsResponse?.data?.data || oddsResponse?.data || {};
      
      // Check for t1, t2 arrays (common format)
      ['t1', 't2', 't3', 'sub'].forEach((key, idx) => {
        if (oddsData[key] && Array.isArray(oddsData[key])) {
          oddsData[key].forEach((item: any) => {
            if (item.nat || item.nation || item.name) {
              extractedBets.push({
                type: item.nat || item.nation || item.name,
                odds: parseFloat(item.b || item.back || item.rate || '1.98') || 1.98,
                status: item.gstatus || 'active',
                min: item.min || 100,
                max: item.max || 100000,
                sid: item.sid
              });
            }
          });
        }
      });

      // If no odds from API, try to get from result data
      if (extractedBets.length === 0) {
        const { data: resultResponse } = await supabase.functions.invoke('diamond-casino-proxy', {
          body: { action: 'get-result', tableId }
        });

        console.log('📊 Result response for odds extraction:', resultResponse);
        
        const resultData = resultResponse?.data?.data || resultResponse?.data || {};
        
        // Extract betting options from result data
        ['t1', 't2', 't3', 'sub'].forEach((key) => {
          if (resultData[key] && Array.isArray(resultData[key])) {
            resultData[key].forEach((item: any) => {
              if (item.nat || item.nation || item.name) {
                extractedBets.push({
                  type: item.nat || item.nation || item.name,
                  odds: parseFloat(item.b || item.back || item.rate || '1.98') || 1.98,
                  status: item.gstatus || 'active',
                  min: item.min || 100,
                  max: item.max || 100000,
                  sid: item.sid
                });
              }
            });
          }
        });
      }

      // If still no bets, generate based on table type
      if (extractedBets.length === 0) {
        // Generate game-specific betting options
        const tableType = tableId.toLowerCase();
        
        if (tableType.includes('teen') || tableType.includes('3patti')) {
          extractedBets = [
            { type: 'Player A', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'playerA' },
            { type: 'Player B', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'playerB' },
          ];
        } else if (tableType.includes('andar') || tableType.includes('bahar') || tableType.includes('ab')) {
          extractedBets = [
            { type: 'Andar', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'andar' },
            { type: 'Bahar', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'bahar' },
          ];
        } else if (tableType.includes('dragon') || tableType.includes('tiger') || tableType.includes('dt')) {
          extractedBets = [
            { type: 'Dragon', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'dragon' },
            { type: 'Tiger', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'tiger' },
            { type: 'Tie', odds: 8, status: 'active', min: 100, max: 50000, sid: 'tie' },
          ];
        } else if (tableType.includes('lucky7') || tableType.includes('lucky')) {
          extractedBets = [
            { type: 'Low (1-6)', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'low' },
            { type: 'High (8-13)', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'high' },
            { type: 'Lucky 7', odds: 10, status: 'active', min: 100, max: 50000, sid: 'lucky7' },
          ];
        } else if (tableType.includes('roulette') || tableType.includes('rou')) {
          extractedBets = [
            { type: 'Red', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'red' },
            { type: 'Black', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'black' },
            { type: 'Odd', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'odd' },
            { type: 'Even', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'even' },
          ];
        } else if (tableType.includes('baccarat') || tableType.includes('bacc')) {
          extractedBets = [
            { type: 'Player', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'player' },
            { type: 'Banker', odds: 1.95, status: 'active', min: 100, max: 100000, sid: 'banker' },
            { type: 'Tie', odds: 8, status: 'active', min: 100, max: 50000, sid: 'tie' },
          ];
        } else if (tableType.includes('sicbo')) {
          extractedBets = [
            { type: 'Big', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'big' },
            { type: 'Small', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'small' },
            { type: 'Odd', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'odd' },
            { type: 'Even', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'even' },
          ];
        } else if (tableType.includes('race') || tableType.includes('card')) {
          extractedBets = [
            { type: 'Card A', odds: 12, status: 'active', min: 100, max: 50000, sid: 'cardA' },
            { type: 'Card 2', odds: 12, status: 'active', min: 100, max: 50000, sid: 'card2' },
            { type: 'Card 3', odds: 12, status: 'active', min: 100, max: 50000, sid: 'card3' },
            { type: 'Card 4', odds: 12, status: 'active', min: 100, max: 50000, sid: 'card4' },
          ];
        } else {
          // Default for unknown games
          extractedBets = [
            { type: 'Option 1', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'opt1' },
            { type: 'Option 2', odds: 1.98, status: 'active', min: 100, max: 100000, sid: 'opt2' },
          ];
        }
      }

      console.log('📊 Final betting options:', extractedBets);
      setOdds({ bets: extractedBets, rawData: oddsData || {} });
      
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
      
      console.log('📊 Current result API response:', data);
      
      // Handle nested response structure: data.data.data.res
      const resData = data?.data?.data?.res || data?.data?.res || [];
      const tableName = data?.data?.data?.res1?.cname || data?.data?.res1?.cname || '';
      
      if (resData.length > 0) {
        const resultData = {
          tableName: tableName,
          latestResult: resData[0] || null,
          results: resData
        };
        setCurrentResult(resultData);
        setResults(prev => ({ ...prev, [tableId]: resultData }));
        
        // Also update resultHistory with this data since history API often returns empty
        setResultHistory(resData);
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
      
      console.log('📊 Result history API response:', data);
      
      // Handle response - data.data is the array directly
      const historyData = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);
      
      if (historyData.length > 0) {
        setResultHistory(historyData);
      }
      // Note: If history is empty, we keep the results from fetchCurrentResult
    } catch (error) {
      console.error('Error fetching result history:', error);
    }
  };

  // Fetch all casino table IDs
  const fetchAllTableIds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-table-ids' }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        console.log('🎰 All Table IDs:', data.data);
        return data.data;
      }
    } catch (error: any) {
      console.error('Error fetching table IDs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch table IDs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    fetchResultHistory,
    fetchAllTableIds
  };
};
