import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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

interface DiamondSID {
  sport_type: string;
  sid: string;
  is_active: boolean;
  is_default: boolean;
}

interface SportsDataContextType {
  getMatchData: (sport: string, kind: 'live' | 'upcoming' | 'results') => UseQueryResult<SportsMatch[], Error>;
  refreshMatchData: (sport: string, kind: 'live' | 'upcoming' | 'results') => Promise<void>;
  lastUpdated: { [key: string]: Date | null };
  availableSports: string[];
}

const SportsDataContext = createContext<SportsDataContextType | null>(null);

// Cache configuration based on match type - NO AUTO REFRESH
const getCacheConfig = (kind: 'live' | 'upcoming' | 'results') => {
  switch (kind) {
    case 'live':
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchInterval: false as const, // No auto-refresh
      };
    case 'upcoming':
      return {
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 60 minutes
        refetchInterval: false as const,
      };
    case 'results':
      return {
        staleTime: 60 * 60 * 1000, // 60 minutes
        gcTime: 120 * 60 * 1000, // 120 minutes
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
  const [lastUpdated, setLastUpdated] = useState<{ [key: string]: Date | null }>({});
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [sidConfigs, setSidConfigs] = useState<DiamondSID[]>([]);

  // Load SID configurations on mount
  useEffect(() => {
    const loadSIDConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('diamond_sports_config')
          .select('*')
          .eq('is_active', true);
        
        if (!error && data) {
          setSidConfigs(data);
          const sports = [...new Set(data.map(config => config.sport_type))];
          setAvailableSports(sports);
          console.log('Loaded SID configs for sports:', sports);
        }
      } catch (error) {
        console.error('Failed to load SID configs:', error);
      }
    };
    
    loadSIDConfigs();
  }, []);

  const fetchMatchData = async (sport: string, kind: 'live' | 'upcoming' | 'results'): Promise<SportsMatch[]> => {
    const cacheConfig = getCacheConfig(kind);
    
    // Try to get from localStorage first
    const cachedData = getFromLocalStorage(sport, kind, cacheConfig.staleTime);
    if (cachedData) {
      console.log(`Using localStorage cache for ${sport} ${kind}`);
      return cachedData;
    }

    // Find SID configuration for this sport
    const sidConfig = sidConfigs.find(config => 
      config.sport_type.toLowerCase() === sport.toLowerCase() && config.is_active
    );

    if (!sidConfig) {
      console.warn(`No active SID configuration found for ${sport}`);
      // Return empty array instead of throwing error
      return [];
    }

    // Fetch from API
    console.log(`Fetching fresh data for ${sport} ${kind} with SID: ${sidConfig.sid}`);
    const endpoint = kind === 'results' ? 'past' : kind;
    
    try {
      // Use Diamond API with SID
      const { data: diamondData, error: diamondError } = await supabase.functions.invoke('sports-diamond-proxy', {
        body: { 
          path: 'sports/esid',
          sid: sidConfig.sid,
          sport: sport,
          kind: endpoint 
        }
      });

      if (!diamondError && diamondData?.data) {
        // Transform Diamond API response to match our format
        const matches = Array.isArray(diamondData.data) ? diamondData.data : 
          diamondData.data.events || diamondData.data.matches || [];
        
        const transformedMatches = matches.map((match: any) => ({
          id: match.eventId || match.id || Math.random().toString(),
          sport: sport,
          status: match.status || 'scheduled',
          date: match.startTime || match.date || new Date().toISOString(),
          homeTeam: match.home?.name || match.homeTeam || 'Team A',
          awayTeam: match.away?.name || match.awayTeam || 'Team B',
          homeScore: match.home?.score || match.homeScore || 0,
          awayScore: match.away?.score || match.awayScore || 0,
          venue: match.venue || '',
          league: match.seriesName || match.league || '',
          provider: 'diamond',
          diamondId: match.eventId || match.id
        }));

        if (transformedMatches.length > 0) {
          saveToLocalStorage(sport, kind, transformedMatches);
          setLastUpdated(prev => ({ ...prev, [`${sport}_${kind}`]: new Date() }));
          return transformedMatches;
        }
      }

      // Fallback to other APIs if Diamond API fails
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
      // Return empty array instead of throwing
      return [];
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
    availableSports,
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