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
  gmid?: string;
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
          sid: options.sid,
          gmid: options.gmid
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

  // Endpoint wrapper functions with correct paths
  const getAllSportsId = useCallback(() => 
    callAPI('sports/allSportid'), [callAPI]);

  const getAllMatch = useCallback((sid?: string) => 
    callAPI('sports/esid', { sid }), [callAPI]);

  const getOdds = useCallback((eventId: string) => 
    callAPI('sports/odds', { params: { eventId } }), [callAPI]);


  const getLiveTv = useCallback((eventId: string) => 
    callAPI('sports/livetv', { params: { eventId } }), [callAPI]);

  const getSportsScore = useCallback((eventId: string) => 
    callAPI('sports/sportsScore', { params: { eventId } }), [callAPI]);

  const getAllGameDetails = useCallback((eventId: string) => 
    callAPI('sports/allGameDetails', { params: { eventId } }), [callAPI]);

  const getMatchResult = useCallback((eventId: string) => 
    callAPI('sports/matchResult', { params: { eventId } }), [callAPI]);

  const postMarketResult = useCallback((marketId: string, selectionId: string, result: string) => 
    callAPI('sports/postMarketResult', { 
      method: 'POST', 
      params: { marketId, selectionId, result }
    }), [callAPI]);

  const getPostedMarketResult = useCallback((marketId: string) => 
    callAPI('sports/postedMarketResult', { params: { marketId } }), [callAPI]);

  const getDiamondIframeTV = useCallback((eventId: string) => 
    callAPI('sports/diamondIframeTV', { params: { eventId } }), [callAPI]);

  const getHlsTv = useCallback((eventId: string) =>
    callAPI('sports/hlstv', { params: { eventid: eventId } }), [callAPI]);

  const getMatchOdds = useCallback((matchId: string) => 
    callAPI('sports/matchOdds', { params: { matchId } }), [callAPI]);

  return {
    loading,
    error,
    // Generic caller
    callAPI,
    // Specific endpoints
    getAllSportsId,
    getAllMatch,
    getOdds,
    getLiveTv,
    getSportsScore,
    getAllGameDetails,
    getMatchResult,
    postMarketResult,
    getPostedMarketResult,
    getDiamondIframeTV,
    getHlsTv,
    getMatchOdds
  };
}