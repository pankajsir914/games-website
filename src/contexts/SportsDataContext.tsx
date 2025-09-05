import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SportsMatch {
  id: string;
  sport: string;
  status: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: string | number;
  awayScore?: string | number;
  venue?: string;
  league?: string;
  provider?: string;
  diamondId?: string;
  rapidApiId?: string;
  cricApiId?: string;
}

interface SportsDataContextType {
  getMatchData: (sport: string, kind: 'live' | 'upcoming' | 'results') => UseQueryResult<SportsMatch[], Error>;
  refreshMatchData: (sport: string, kind: 'live' | 'upcoming' | 'results') => Promise<void>;
  lastUpdated: { [key: string]: Date | null };
}

const SportsDataContext = createContext<SportsDataContextType | null>(null);

// Cache configuration based on match type
const getCacheConfig = (kind: 'live' | 'upcoming' | 'results') => {
  switch (kind) {
    case 'live':
      return {
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes for live matches
      };
    case 'upcoming':
      return {
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchInterval: false as const,
      };
    case 'results':
      return {
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 60 minutes
        refetchInterval: false as const,
      };
  }
};

// Local storage helper functions
const getLocalStorageKey = (sport: string, kind: string) => `sports_cache_${sport}_${kind}`;

const saveToLocalStorage = (sport: string, kind: string, data: SportsMatch[]) => {
  try {
    const key = getLocalStorageKey(sport, kind);
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const getFromLocalStorage = (sport: string, kind: string, maxAge: number): SportsMatch[] | null => {
  try {
    const key = getLocalStorageKey(sport, kind);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < maxAge) {
      return data;
    }
    
    // Remove stale data
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Failed to get from localStorage:', error);
    return null;
  }
};

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = React.useState<{ [key: string]: Date | null }>({});

  const fetchMatchData = async (sport: string, kind: 'live' | 'upcoming' | 'results'): Promise<SportsMatch[]> => {
    const cacheConfig = getCacheConfig(kind);
    
    // Try to get from localStorage first
    const cachedData = getFromLocalStorage(sport, kind, cacheConfig.staleTime);
    if (cachedData) {
      console.log(`Using localStorage cache for ${sport} ${kind}`);
      return cachedData;
    }

    // Fetch from API
    console.log(`Fetching fresh data for ${sport} ${kind}`);
    const endpoint = kind === 'results' ? 'past' : kind;
    
    try {
      // Try Diamond API first
      const { data: diamondData, error: diamondError } = await supabase.functions.invoke('sports-diamond-proxy', {
        body: { path: 'sports/esid', sport, kind: endpoint }
      });

      if (!diamondError && diamondData?.data?.length > 0) {
        const matches = diamondData.data as SportsMatch[];
        saveToLocalStorage(sport, kind, matches);
        setLastUpdated(prev => ({ ...prev, [`${sport}_${kind}`]: new Date() }));
        return matches;
      }

      // Fallback to other APIs
      const { data, error } = await supabase.functions.invoke('sports-proxy', {
        body: { sport, kind: endpoint }
      });

      if (error) throw error;
      
      const matches = data?.data || [];
      saveToLocalStorage(sport, kind, matches);
      setLastUpdated(prev => ({ ...prev, [`${sport}_${kind}`]: new Date() }));
      return matches;
    } catch (error) {
      console.error(`Error fetching ${sport} ${kind}:`, error);
      // Return cached data even if stale
      const staleData = getFromLocalStorage(sport, kind, Infinity);
      if (staleData) {
        toast.warning('Using cached data - API temporarily unavailable');
        return staleData;
      }
      throw error;
    }
  };

  const getMatchData = (sport: string, kind: 'live' | 'upcoming' | 'results') => {
    const cacheConfig = getCacheConfig(kind);
    
    return useQuery({
      queryKey: ['sports', sport, kind],
      queryFn: () => fetchMatchData(sport, kind),
      ...cacheConfig,
      retry: 2,
      retryDelay: 1000,
    });
  };

  const refreshMatchData = async (sport: string, kind: 'live' | 'upcoming' | 'results') => {
    // Clear localStorage cache
    const key = getLocalStorageKey(sport, kind);
    localStorage.removeItem(key);
    
    // Invalidate React Query cache
    await queryClient.invalidateQueries({ queryKey: ['sports', sport, kind] });
    
    toast.success('Data refreshed');
  };

  const value: SportsDataContextType = {
    getMatchData,
    refreshMatchData,
    lastUpdated,
  };

  return (
    <SportsDataContext.Provider value={value}>
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsDataContext = () => {
  const context = useContext(SportsDataContext);
  if (!context) {
    throw new Error('useSportsDataContext must be used within SportsDataProvider');
  }
  return context;
};