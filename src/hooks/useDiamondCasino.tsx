import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';



type Maybe<T> = T | null | undefined;

interface DiamondTable {
  id: string;
  name: string;
  status: string;
  players?: number;
  data?: any;
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
  user_id?: string;
}

interface OddsBetOption {
  type: string;
  odds: number;
  back?: number;
  lay?: number;
  status?: string;
  min?: number;
  max?: number;
  sid?: string;
  mid?: string;
}

interface OddsState {
  bets: OddsBetOption[];
  rawData?: any;
  noOdds?: boolean;
  error?: boolean;
}


// Helpers
const safeGet = (obj: any, ...paths: string[]) => {
  let cur = obj;
  for (const p of paths) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur;
};

const extractFilename = (url?: string) => {
  if (!url) return undefined;
  try {
    // If it's a full URL, parse; otherwise treat as path
    const u = new URL(url, 'http://example.com');
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : undefined;
  } catch {
    // fallback: split by slash
    const parts = url.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : undefined;
  }
};

// Defensive parser for odds responses. Many casino APIs return wildly different shapes.
const parseOddsResponse = (oddsResponse: any): OddsState => {
  const out: OddsState = { bets: [], rawData: oddsResponse };
  const data = oddsResponse?.data || oddsResponse || {};

  // Case 1: standardized bets array
  if (Array.isArray(data?.bets) && data.bets.length > 0) {
    out.bets = data.bets.map((b: any) => ({
      type: b.type || b.name || String(b.sid || b.id || 'unknown'),
      odds: Number(b.back > 0 ? b.back : b.rate || b.odds) || 1.98,
      back: Number(b.back || 0),
      lay: Number(b.lay || 0),
      status: b.status || 'active',
      min: Number(b.min || 100),
      max: Number(b.max || 100000),
      sid: b.sid,
      mid: b.mid
    }));
    return out;
  }

  // Case 2: nested raw data with keys like t1/t2/t3 or arrays
  const tryKeys = ['t1', 't2', 't3', 'sub', 'markets', 'options'];
  for (const k of tryKeys) {
    const arr = data[k];
    if (Array.isArray(arr) && arr.length) {
      arr.forEach((item: any) => {
        const name = item.nat || item.nation || item.name || item.label || item.title || item.team || item.type;
        if (!name) return;
        out.bets.push({
          type: String(name),
          odds: Number(item.b1 || item.b || item.rate || item.odds) || 1.98,
          back: Number(item.b1 || item.b || 0) || 0,
          lay: Number(item.l1 || item.l || 0) || 0,
          status: item.gstatus === '0' ? 'suspended' : 'active',
          min: Number(item.min || 100),
          max: Number(item.max || 100000),
          sid: item.sid,
          mid: item.mid
        });
      });
      if (out.bets.length) return out;
    }
  }

  // Case 3: fallback - try to find any arrays in data and interpret the first array of objects
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (Array.isArray(val) && val.length && typeof val[0] === 'object') {
      val.forEach((item: any) => {
        const name = item.name || item.title || item.label || item.nat || item.nation;
        if (!name) return;
        out.bets.push({
          type: String(name),
          odds: Number(item.b1 || item.b || item.rate || item.odds) || 1.98,
          back: Number(item.b1 || item.b || 0) || 0,
          lay: Number(item.l1 || item.l || 0) || 0,
          status: item.gstatus === '0' ? 'suspended' : 'active',
          sid: item.sid,
          mid: item.mid
        });
      });
      if (out.bets.length) return out;
    }
  }

  // No odds found
  out.noOdds = true;
  return out;
};


/**
 * useTables - fetches live tables, provides fallback to DB cache, and supports image proxy option.
 */
export const useTables = (opts?: { edgeFunctionName?: string; useImageProxy?: boolean }) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<DiamondTable[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const edgeFn = opts?.edgeFunctionName || 'diamond-casino-proxy';

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mapApiTable = (t: any): DiamondTable => {
    const id = t.id || t.table_id || String(t.tid || t.id || t.tableId || '') || '';
    const name = t.name || t.table_name || t.cname || t.displayName || '';
    const status = t.status || t.state || 'unknown';
    const players = Number(t.players || t.player_count || t.playerCount || 0);

    let imageUrl: string | undefined;
    if (opts?.useImageProxy && t.imageUrl) {
      const filename = extractFilename(t.imageUrl);
      if (filename) imageUrl = `${supabase.functions?.url?.replace?.(/\/$/, '') || 'https://'+(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF||'foiojihgpeehvpwejeqw')}.supabase.co/functions/v1/${edgeFn}?image=${encodeURIComponent(filename)}`;
    } else if (t.imageUrl) {
      imageUrl = t.imageUrl;
    } else if (t.table_data && typeof t.table_data === 'object' && t.table_data.imageUrl) {
      imageUrl = t.table_data.imageUrl;
    }

    return {
      id,
      name,
      status,
      players,
      data: t,
      imageUrl
    };
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(edgeFn, {
        body: { action: 'get-tables' }
      });

      if (error) throw error;
      if (!data) throw new Error('No data from casino edge function');

      const tablesFromApi = safeGet(data, 'data', 'tables') || data.data || data.tables || data;

      if (Array.isArray(tablesFromApi) && tablesFromApi.length) {
        const mapped = tablesFromApi.map(mapApiTable);
        if (isMounted.current) setTables(mapped);
        return mapped;
      }

      // fallback to DB cache
      const { data: cachedTables } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .eq('status', 'active')
        .order('last_updated', { ascending: false })
        .limit(200);

      if (cachedTables && cachedTables.length) {
        const mapped = cachedTables.map((ct: any) => ({
          id: ct.table_id || ct.id || ct.tableId,
          name: ct.table_name || ct.name,
          status: ct.status,
          players: ct.player_count || ct.players,
          data: ct.table_data,
          imageUrl: (ct.table_data && ct.table_data.imageUrl) || ct.image_url || ct.imageUrl
        }));
        if (isMounted.current) setTables(mapped);
        toast({ title: 'Using Cached Data', description: 'Live connection unavailable. Showing last known tables.' });
        return mapped;
      }

      // nothing
      if (isMounted.current) setTables([]);
      return [];
    } catch (err: any) {
      console.error('useTables.fetch error', err);
      toast({ title: 'Casino Connection Error', description: (err?.message) || 'Failed to load live casino tables.', variant: 'destructive' });
      if (isMounted.current) setTables([]);
      return [];
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return { tables, loading, fetch };
};

/**
 * useBets - fetches user bets and provides realtime subscription (cleaned up properly)
 */
export const useBets = () => {
  const { toast } = useToast();
  const [bets, setBets] = useState<DiamondBet[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const fetchUserBets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('diamond_casino_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (isMounted.current) setBets(data || []);
      return data || [];
    } catch (err) {
      console.error('useBets.fetchUserBets error', err);
      return [];
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const setupRealtime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean any existing channel
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (e) {}
      }

      const channel = supabase
        .channel(`diamond-casino-bets-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'diamond_casino_bets', filter: `user_id=eq.${user.id}` },
          (payload: any) => {
            // Re-fetch - cheaper to fetch the last few items rather than rely entirely on payload shape
            fetchUserBets();
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (err) {
      console.error('useBets.setupRealtime error', err);
    }
  };

  return { bets, loading, fetchUserBets, setupRealtime };
};

/**
 * useOdds - fetches odds for a given table and returns structured result
 */
export const useOdds = () => {
  const [odds, setOdds] = useState<OddsState>({ bets: [] });
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const fetchOdds = async (tableId: string) => {
    setLoading(true);
    try {
      const { data: oddsResponse, error } = await supabase.functions.invoke('diamond-casino-proxy', {
        body: { action: 'get-odds', tableId }
      });

      if (error) throw error;

      const parsed = parseOddsResponse(oddsResponse?.data || oddsResponse);
      if (isMounted.current) setOdds(parsed);
      return parsed;
    } catch (err) {
      console.error('useOdds.fetchOdds error', err);
      const fallback: OddsState = { bets: [], rawData: undefined, error: true };
      if (isMounted.current) setOdds(fallback);
      return fallback;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return { odds, loading, fetchOdds };
};

/**
 * useResults - current result, result history and stream URL handling
 */
export const useResults = () => {
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [resultHistory, setResultHistory] = useState<any[]>([]);
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const fetchCurrentResult = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', { body: { action: 'get-result', tableId } });
      if (error) throw error;
      const resData = safeGet(data, 'data', 'data', 'res') || safeGet(data, 'data', 'res') || safeGet(data, 'res') || [];
      const tableName = safeGet(data, 'data', 'data', 'res1', 'cname') || safeGet(data, 'data', 'res1', 'cname') || '';
      if (Array.isArray(resData) && resData.length) {
        const resultData = { tableName, latestResult: resData[0], results: resData };
        if (isMounted.current) {
          setCurrentResult(resultData);
          setResultHistory(resData);
        }
        return resultData;
      }
      return null;
    } catch (err) {
      console.error('useResults.fetchCurrentResult error', err);
      return null;
    }
  };

  const fetchResultHistory = async (tableId: string, date?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', { body: { action: 'get-result-history', tableId, date } });
      if (error) throw error;

      const history = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);
      if (Array.isArray(history) && history.length) {
        if (isMounted.current) setResultHistory(history);
        return history;
      }
      return [];
    } catch (err) {
      console.error('useResults.fetchResultHistory error', err);
      return [];
    }
  };

  const fetchStreamUrl = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('diamond-casino-proxy', { body: { action: 'get-stream-url', tableId } });
      if (error) throw error;

      // Accept multiple shapes
      const tv = safeGet(data, 'data', 'data', 'tv_url') || safeGet(data, 'data', 'tvUrl') || safeGet(data, 'data', 'tv_url') || safeGet(data, 'tv_url');
      if (tv) {
        if (isMounted.current) setStreamUrls(prev => ({ ...prev, [tableId]: tv }));
        return tv;
      }
      return null;
    } catch (err) {
      console.error('useResults.fetchStreamUrl error', err);
      return null;
    }
  };

  return { currentResult, resultHistory, streamUrls, loading, fetchCurrentResult, fetchResultHistory, fetchStreamUrl };
};

// -----------------------------
// High-level composite hook
// -----------------------------

/**
 * useDiamondCasino - main convenience hook that composes smaller hooks
 * and exposes a simple surface for UI components.
 */
export const useDiamondCasino = (opts?: { useImageProxy?: boolean; edgeFunctionName?: string }) => {
  const tablesHook = useTables({ edgeFunctionName: opts?.edgeFunctionName, useImageProxy: opts?.useImageProxy });
  const betsHook = useBets();
  const oddsHook = useOdds();
  const resultsHook = useResults();
  const { toast } = useToast();

  // Place bet - ensures user auth and includes user id in payload
  const placeBet = async (betData: {
    tableId: string;
    tableName: string;
    amount: number;
    betType: string;
    odds: number;
    roundId?: string;
  }) => {
    try {
      // ensure logged in
      const { data: { session, user } } = await supabase.auth.getSession();
      if (!session || !user) throw new Error('You must be logged in to place bets');

      const payload = { ...betData, user_id: user.id };

      const { data, error } = await supabase.functions.invoke(opts?.edgeFunctionName || 'diamond-casino-proxy', {
        body: { action: 'place-bet', betData: payload },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Bet Placed!', description: `You bet ₹${betData.amount} on ${betData.betType}` });
        // refresh bets
        betsHook.fetchUserBets();
        return data.bet || data;
      }

      throw new Error(data?.error || 'Bet placement failed');
    } catch (err: any) {
      console.error('useDiamondCasino.placeBet error', err);
      toast({ title: 'Bet Failed', description: err.message || 'Failed to place bet', variant: 'destructive' });
      throw err;
    }
  };

  // convenience initializers
  const initialLoad = async () => {
    await tablesHook.fetch();
    await betsHook.fetchUserBets();
    betsHook.setupRealtime();
  };

  return {
    // tables
    liveTables: tablesHook.tables,
    loadTables: tablesHook.fetch,
    tablesLoading: tablesHook.loading,

    // bets
    bets: betsHook.bets,
    fetchUserBets: betsHook.fetchUserBets,
    setupBetsRealtime: betsHook.setupRealtime,
    betsLoading: betsHook.loading,

    // odds
    odds: oddsHook.odds,
    fetchOdds: oddsHook.fetchOdds,
    oddsLoading: oddsHook.loading,

    // results
    currentResult: resultsHook.currentResult,
    resultHistory: resultsHook.resultHistory,
    streamUrls: resultsHook.streamUrls,
    fetchCurrentResult: resultsHook.fetchCurrentResult,
    fetchResultHistory: resultsHook.fetchResultHistory,
    fetchStreamUrl: resultsHook.fetchStreamUrl,

    // actions
    placeBet,
    initialLoad
  };
};


/*
import React, { useEffect } from 'react';
import { useDiamondCasino } from './useDiamondCasino';

export const CasinoDashboard = () => {
  const { liveTables, initialLoad, placeBet, fetchOdds, odds, fetchCurrentResult } = useDiamondCasino({ useImageProxy: true });

  useEffect(() => { initialLoad(); }, []);

  // ... UI renders tables, odds etc
};
*/
