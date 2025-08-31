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
        // Betfair specific fields
        backPrice?: number | null;
        layPrice?: number | null;
        backSize?: number;
        laySize?: number;
        totalMatched?: number;
        lastPriceTraded?: number | null;
        backLadder?: Array<{ price: number; size: number }>;
        layLadder?: Array<{ price: number; size: number }>;
        tradedVolume?: Array<{ price: number; size: number }>;
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
  betfair?: {
    event?: {
      id?: string;
      name?: string;
      countryCode?: string;
      timezone?: string;
      venue?: string;
      openDate?: string;
    };
    competition?: {
      id?: string;
      name?: string;
    };
    market?: {
      id?: string;
      name?: string;
      type?: string;
      startTime?: string;
    };
    marketBook?: {
      status?: string;
      betDelay?: number;
      inplay?: boolean;
      totalMatched?: number;
      totalAvailable?: number;
      lastMatchTime?: string;
    } | null;
  };
}

export interface OddsResponse {
  data: BettingOdds[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
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
      provider?: 'odds-api' | 'betfair' | 'mock';
      page?: number;
      pageSize?: number;
    }
  ): Promise<OddsResponse> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('sports-odds', {
        body: {
          sport,
          matchId,
          region: options?.region || 'us',
          markets: options?.markets || ['h2h'],
          bookmakers: options?.bookmakers,
          provider: options?.provider,
          page: options?.page || 1,
          pageSize: options?.pageSize || 20,
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch odds');
      }

      if (!data || !data.data) {
        throw new Error('No odds data received');
      }

      // Transform the data
      const transformedData = data.data.map((event: any) => ({
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
        lastUpdate: event.lastUpdate || new Date().toISOString(),
        mock: data.mock || false,
        betfair: event.betfair,
      }));

      return {
        data: transformedData,
        pagination: data.pagination || {
          page: 1,
          pageSize: transformedData.length,
          totalCount: transformedData.length,
          totalPages: 1
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch odds';
      setError(message);
      console.error('Error fetching odds:', err);
      
      // Return empty response on error
      return {
        data: [],
        pagination: {
          page: 1,
          pageSize: 0,
          totalCount: 0,
          totalPages: 0
        }
      };
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