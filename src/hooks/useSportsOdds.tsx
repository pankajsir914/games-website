import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BettingOdds {
  matchId: string;
  sport: string;
  home_team?: string;
  away_team?: string;
  exchange?: boolean;
  liquidity?: number;
  competition?: string;
  event?: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price?: number;
        point?: number;
      }>;
    }>;
  }>;
  odds?: {
    h2h?: Array<{
      bookmaker: string;
      home: string;
      away: string;
      draw?: string | null;
    }>;
    spreads?: Array<{
      bookmaker: string;
      home: { points: string; odds: string };
      away: { points: string; odds: string };
    }>;
    totals?: Array<{
      bookmaker: string;
      points: string;
      over: string;
      under: string;
    }>;
  };
  lastUpdate?: string;
}

export function useSportsOdds() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async (
    sport: string, 
    matchId?: string,
    options?: {
      region?: string;
      markets?: string[];
      bookmakers?: string[];
      provider?: 'odds-api' | 'rapidapi';
    }
  ): Promise<BettingOdds[]> => {
    setLoading(true);
    setError(null);

    try {
      // Try RapidAPI first if provider is rapidapi or not specified
      if (!options?.provider || options?.provider === 'rapidapi') {
        try {
          const { data: rapidData, error: rapidError } = await supabase.functions.invoke('sports-rapidapi-odds', {
            body: {
              sport,
              matchId,
              region: options?.region || 'us',
              markets: options?.markets || ['h2h', 'spreads', 'totals']
            }
          });

          if (!rapidError && rapidData?.success && rapidData?.data) {
            return rapidData.data as BettingOdds[];
          }
        } catch (rapidApiError) {
          console.log('RapidAPI odds not available, falling back to other providers');
        }
      }

      // Fallback to existing sports-odds function
      const { data, error: fetchError } = await supabase.functions.invoke('sports-odds', {
        body: {
          sport,
          matchId,
          region: options?.region || 'us',
          markets: options?.markets || ['h2h', 'spreads', 'totals'],
          bookmakers: options?.bookmakers,
          provider: options?.provider || 'odds-api',
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch odds');
      }

      if (!data || !data.data) {
        throw new Error('No odds data received');
      }

      // Transform real API data
      return data.data.map((event: any) => ({
        matchId: event.id || matchId,
        sport,
        home_team: event.home_team,
        away_team: event.away_team,
        exchange: event.exchange,
        liquidity: event.liquidity,
        competition: event.competition,
        event: event.event,
        bookmakers: event.bookmakers || [],
        odds: event.odds,
        lastUpdate: event.lastUpdate || new Date().toISOString()
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch odds';
      setError(message);
      console.error('Error fetching odds:', err);
      
      // Return empty array on error
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchOdds,
    loading,
    error,
  };
}