import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiamondAPIResponse<T = any> {
  success: boolean;
  provider: string;
  cached?: boolean;
  data: T;
  error?: string;
}

interface DiamondAPIOptions {
  method?: 'GET' | 'POST';
  params?: Record<string, string>;
  payload?: any;
  sid?: string;
}

export function useDiamondSportsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = useCallback(async <T = any>(
    path: string,
    options: DiamondAPIOptions = {}
  ): Promise<DiamondAPIResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sports-diamond-proxy', {
        body: {
          path,
          method: options.method || 'GET',
          params: options.params,
          payload: options.payload,
          sid: options.sid
        }
      });

      if (fnError) throw new Error(fnError.message);
      
      if (!data?.success) {
        throw new Error(data?.error || 'API call failed');
      }

      return data as DiamondAPIResponse<T>;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch data';
      setError(errorMsg);
      console.error('Diamond Sports API error:', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Endpoint wrapper functions
  const getAllSportsId = useCallback(() => 
    callAPI('sports/allSportid'), [callAPI]);

  const getAllMatch = useCallback((sid?: string) => 
    callAPI('sports/esid', { sid }), [callAPI]);

  const getOdds = useCallback((params: Record<string, string>) => 
    callAPI('odds', { params }), [callAPI]);

  const diamondToBetfairId = useCallback((matchId: string) => 
    callAPI('diamond-to-betfair', { params: { matchId } }), [callAPI]);

  const matchNameToBetfair = useCallback((matchName: string) => 
    callAPI('match-name-to-betfair', { params: { matchName } }), [callAPI]);

  const getLiveTv = useCallback((matchId: string) => 
    callAPI('live-tv', { params: { matchId } }), [callAPI]);

  const getSportsScore = useCallback((matchId: string) => 
    callAPI('sports-score', { params: { matchId } }), [callAPI]);

  const getAllGameDetails = useCallback((matchId: string) => 
    callAPI('game-details', { params: { matchId } }), [callAPI]);

  const getMatchResult = useCallback((betfairId: string) => 
    callAPI('match-result', { params: { betfairId } }), [callAPI]);

  const postMarketResult = useCallback((marketId: string, result: any) => 
    callAPI('market-result', { 
      method: 'POST', 
      payload: { marketId, result } 
    }), [callAPI]);

  const getPostedMarketResult = useCallback((marketId: string) => 
    callAPI('posted-market-result', { params: { marketId } }), [callAPI]);

  const getDiamondIframeTV = useCallback((matchId: string) => 
    callAPI('diamond-iframe-tv', { params: { matchId } }), [callAPI]);

  return {
    loading,
    error,
    // Generic caller
    callAPI,
    // Specific endpoints
    getAllSportsId,
    getAllMatch,
    getOdds,
    diamondToBetfairId,
    matchNameToBetfair,
    getLiveTv,
    getSportsScore,
    getAllGameDetails,
    getMatchResult,
    postMarketResult,
    getPostedMarketResult,
    getDiamondIframeTV
  };
}