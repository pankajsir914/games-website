import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BettingOdds {
  matchId: string;
  sport: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
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
  mock?: boolean;
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
    }
  ): Promise<BettingOdds[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('sports-odds', {
        body: {
          sport,
          matchId,
          region: options?.region || 'us',
          markets: options?.markets || ['h2h', 'spreads', 'totals'],
          bookmakers: options?.bookmakers,
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch odds');
      }

      if (!data || !data.data) {
        throw new Error('No odds data received');
      }

      // If mock data, transform it to match our interface
      if (data.mock && data.data[0]?.odds) {
        return data.data;
      }

      // Transform real API data
      return data.data.map((event: any) => ({
        matchId: event.id || matchId,
        sport,
        bookmakers: event.bookmakers || [],
        odds: event.odds,
        lastUpdate: event.lastUpdate || new Date().toISOString(),
        mock: data.mock || false,
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