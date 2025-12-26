import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiamondAPIResponse<T = any> {
  success: boolean;
  provider: string;
  cached?: boolean;
  data: T;
  error?: string;
  errorCode?: number;
  debug?: any;
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

    // Map existing path strings to the edge function's expected "action" values
    const pathToAction: Record<string, string> = {
      'sports/esid': 'esid',
      'sports/getDetailsData': 'details',
      'sports/getPriveteData': 'private',
      'sports/betfairscorecardandtv': 'score-tv',
      'sports/virtual/tvurl': 'virtual-tv',
      'sports/welcomebanner': 'banner',
      'sports/topevents': 'top-events',
      'sports/posted-market-result': 'market-result',
      'sports/sportsScore': 'sports-score',
      'sports/allGameDetails': 'all-game-details',
      'sports/odds': 'odds',
      'sports/livetv': 'livetv',
      'sports/diamondIframeTV': 'diamond-iframe-tv',
      'sports/hlstv': 'hls-tv',
      'sports/matchOdds': 'match-odds',
      'sports/diamondOriginalTv': 'diamond-original-tv'
    };

    try {
      const action = pathToAction[path];

      // Build request body expected by the Supabase edge function
      if (action) {
        const body: Record<string, any> = { action };

        // Populate common identifiers
        const sid = options.sid 
          || options.params?.sid 
          || options.params?.diamondsportsid;
        const gmid = options.gmid 
          || options.params?.gmid 
          || options.params?.eventId 
          || options.params?.matchId
          || options.params?.diamondeventid;
        const eventid = options.params?.eventid || options.params?.eventId;

        // Debug logging for diamond-original-tv
        if (action === 'diamond-original-tv') {
          console.log('🔍 [useDiamondSportsAPI] diamond-original-tv call:', {
            action,
            options,
            extractedSid: sid,
            extractedGmid: gmid
          });
        }

        if (action === 'esid' && sid) body.sid = sid;
        if (['details', 'private', 'score-tv', 'virtual-tv', 'sports-score', 'all-game-details', 'odds', 'livetv', 'diamond-iframe-tv', 'hls-tv', 'match-odds', 'diamond-original-tv'].includes(action)) {
          if (sid) body.sid = sid;
          if (gmid) body.gmid = gmid;
        }
        if (action === 'market-result' && eventid) body.eventid = eventid;

        const { data, error: fnError } = await supabase.functions.invoke('sports-diamond-proxy', { body });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) {
          throw new Error(data?.error || 'API call failed');
        }

        return data as DiamondAPIResponse<T>;
      }

      // Fallback: keep previous behavior for any unsupported paths
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

  // Get detailed odds/market data for a specific match (getPriveteData endpoint)
  const getPriveteData = useCallback(async (sid: string, gmid: string) => {
    if (!sid || !gmid) {
      setError('Both SID and GMID are required');
      return null;
    }
    const resp = await callAPI<any>('sports/getPriveteData', { sid, gmid });
    console.log('getPriveteData response', {
      sid,
      gmid,
      success: resp?.success,
      provider: resp?.provider,
      hasData: Boolean(resp?.data),
      dataSample: resp?.data
    });
    return resp;
  }, [callAPI]);

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

  const getBetfairScoreTv = useCallback((
    diamondeventid: string,
    diamondsportsid: string,
    betfaireventid?: string,
    sportsradareventid?: string,
    betfairsportsid?: string
  ) => 
    callAPI('sports/betfairscorecardandtv', { 
      params: { 
        diamondeventid,
        diamondsportsid,
        ...(betfaireventid && { betfaireventid }),
        ...(sportsradareventid && { sportsradareventid }),
        ...(betfairsportsid && { betfairsportsid })
      } 
    }), [callAPI]);

  const getDetailsData = useCallback((sid: string, gmid: string) => 
    callAPI('sports/getDetailsData', { sid, gmid }), [callAPI]);

  const getDiamondOriginalTv = useCallback((gmid: string, sid: string) => {
    console.log('🔍 [useDiamondSportsAPI] getDiamondOriginalTv called with:', { gmid, sid });
    return callAPI('sports/diamondOriginalTv', { gmid, sid });
  }, [callAPI]);

  return {
    loading,
    error,
    // Generic caller
    callAPI,
    // Specific endpoints
    getAllSportsId,
    getAllMatch,
    getPriveteData,
    getOdds,
    getLiveTv,
    getSportsScore,
    getAllGameDetails,
    getMatchResult,
    postMarketResult,
    getPostedMarketResult,
    getDiamondIframeTV,
    getHlsTv,
    getMatchOdds,
    getBetfairScoreTv,
    getDetailsData,
    getDiamondOriginalTv
  };
}
