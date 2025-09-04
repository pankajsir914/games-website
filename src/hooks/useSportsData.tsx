import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SportsMatch {
  id: string;
  sport: string;
  date: string | null;
  league: string;
  venue?: string | null;
  status: string;
  teams: { home: string; away: string };
  scores: { home: number | null; away: number | null };
  overs?: { home: string; away: string };
  wickets?: { home: number; away: number };
  commentary?: string[];
  raw?: any;
}

export interface SportsSettings {
  sport_type: string;
  is_enabled: boolean;
  show_live: boolean;
  show_upcoming: boolean;
  show_completed: boolean;
  refresh_interval: number;
  settings: any;
}

// Function to categorize matches based on status
function categorizeMatchByStatus(status: string): 'live' | 'upcoming' | 'results' {
  const statusLower = status.toLowerCase();
  
  // Live/Ongoing matches
  if (statusLower.includes('live') || 
      statusLower.includes('in progress') || 
      statusLower.includes('ongoing') || 
      statusLower.includes('playing') ||
      statusLower.includes('1st innings') ||
      statusLower.includes('2nd innings') ||
      statusLower.includes('break') ||
      statusLower.includes('rain') ||
      statusLower.includes('delay')) {
    return 'live';
  }
  
  // Completed/Past matches
  if (statusLower.includes('won') || 
      statusLower.includes('completed') || 
      statusLower.includes('finished') || 
      statusLower.includes('result') ||
      statusLower.includes('declared') ||
      statusLower.includes('ended') ||
      statusLower.includes('match tied') ||
      statusLower.includes('no result')) {
    return 'results';
  }
  
  // Default to upcoming for not started matches
  return 'upcoming';
}

export function useSportsData(sport: string, kind: 'live' | 'upcoming' | 'results') {
  const [data, setData] = useState<SportsMatch[] | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!sport || !kind) return;
    
    // Only show loading for initial load, not background refreshes
    if (!isBackground && !data) {
      setInitialLoading(true);
    } else if (isBackground) {
      setRefreshing(true);
    }
    setError(null);
    
    try {
      // First, get enabled match IDs for filtering
      const { data: enabledMatches } = await supabase
        .from('sports_match_settings')
        .select('match_id')
        .eq('sport_type', sport)
        .eq('betting_enabled', true);

      const enabledMatchIds = enabledMatches?.map(m => m.match_id) || [];

      // Try RapidAPI first
      try {
        const { data: rapidResponse, error: rapidError } = await supabase.functions.invoke('sports-rapidapi', {
          body: JSON.stringify({ sport, type: kind })
        });

        if (rapidResponse?.success && rapidResponse?.data) {
          let matches = rapidResponse.data;
          
          // Filter by enabled matches if betting is controlled
          if (enabledMatchIds.length > 0) {
            matches = matches.filter((match: SportsMatch) => 
              enabledMatchIds.includes(match.id)
            );
          }
          
          setData(matches);
          setLastRefresh(new Date());
          setInitialLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (rapidApiError) {
        console.log('RapidAPI not available, falling back to legacy API');
      }

      // Fallback to legacy cricket API for cricket
      if (sport === 'cricket') {
        try {
          const response = await fetch(
            `https://api.cricapi.com/v1/currentMatches?apikey=a4cd2ec0-4175-4263-868a-22ef5cbd9316&offset=0`
          );
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'success' && result.data) {
              const allMatches = result.data.map((match: any) => {
                const homeTeam = match.teamInfo?.[0]?.name || match.teams?.[0] || 'Team A';
                const awayTeam = match.teamInfo?.[1]?.name || match.teams?.[1] || 'Team B';
                
                const homeScore = match.score?.[0];
                const awayScore = match.score?.[1];
                
                return {
                  id: match.id,
                  sport: 'cricket',
                  date: match.dateTimeGMT || match.date,
                  league: match.name || 'Cricket Match',
                  venue: match.venue,
                  status: match.status,
                  teams: {
                    home: homeTeam,
                    away: awayTeam
                  },
                  scores: {
                    home: homeScore?.r || null,
                    away: awayScore?.r || null
                  },
                  overs: homeScore && awayScore ? {
                    home: homeScore.o?.toString() || '0',
                    away: awayScore.o?.toString() || '0'
                  } : undefined,
                  wickets: homeScore && awayScore ? {
                    home: homeScore.w || 0,
                    away: awayScore.w || 0
                  } : undefined,
                  raw: match
                } as SportsMatch;
              });
              
              // Filter matches based on their status AND betting enabled
              const filteredMatches = allMatches.filter((match: SportsMatch) => {
                const matchCategory = categorizeMatchByStatus(match.status);
                return matchCategory === kind && enabledMatchIds.includes(match.id);
              });
              
              setData(filteredMatches);
              setLastRefresh(new Date());
              setInitialLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch (err) {
          console.log('Cricket API fallback also failed');
        }
      }
      
      // Check cache first if not forcing refresh for other sports
      if (!forceRefresh) {
        const { data: cachedData } = await supabase
          .from('sports_matches_cache')
          .select('match_data, expires_at')
          .eq('sport_type', sport)
          .eq('match_kind', kind)
          .gt('expires_at', new Date().toISOString());
        
        if (cachedData && cachedData.length > 0) {
          const matches = cachedData.map(item => item.match_data as unknown as SportsMatch);
          // Filter cached matches to only show betting enabled ones
          const filteredMatches = matches.filter(match => enabledMatchIds.includes(match.id));
          setData(filteredMatches);
          setLastRefresh(new Date());
          setInitialLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Fetch from API for other sports
      const { data: apiData, error: apiError } = await supabase.functions.invoke('sports-proxy', {
        body: { sport, kind, date: null, team: '' }
      });

      if (apiError) throw new Error(apiError.message);
      
      const matches = apiData?.items || [];
      
      // Filter matches from other sports APIs based on status AND betting enabled
      const filteredMatches = matches.filter((match: SportsMatch) => {
        const matchCategory = categorizeMatchByStatus(match.status);
        return matchCategory === kind && enabledMatchIds.includes(match.id);
      });
      
      // Set data without any fallback sample data
      setData(filteredMatches);
      setLastRefresh(new Date());

      // Cache the filtered results
      const cacheData = filteredMatches.map((match: SportsMatch) => ({
        sport_type: sport,
        match_kind: kind,
        match_id: match.id,
        match_data: match,
        expires_at: new Date(Date.now() + 30 * 1000).toISOString() // 30 seconds
      }));

      if (cacheData.length > 0) {
        await supabase
          .from('sports_matches_cache')
          .upsert(cacheData, { 
            onConflict: 'sport_type,match_kind,match_id',
            ignoreDuplicates: false 
          });
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch sports data');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [sport, kind]);

  const refresh = () => fetchData(true, false);
  const backgroundRefresh = () => fetchData(true, true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading: initialLoading, 
    refreshing, 
    error, 
    refresh, 
    backgroundRefresh, 
    lastRefresh 
  };
}

export function useSportsSettings() {
  const [settings, setSettings] = useState<SportsSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('sports_settings')
        .select('*')
        .eq('is_enabled', true);
      
      setSettings(data || []);
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const updateSetting = async (sportType: string, updates: Partial<SportsSettings>) => {
    const { error } = await supabase
      .from('sports_settings')
      .update(updates)
      .eq('sport_type', sportType);
    
    if (!error) {
      setSettings(prev => 
        prev.map(s => s.sport_type === sportType ? { ...s, ...updates } : s)
      );
    }
    
    return { error };
  };

  return { settings, loading, updateSetting };
}

export function useAutoRefresh(callback: () => void, interval: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !callback) return;

    const intervalId = setInterval(callback, interval * 1000);
    return () => clearInterval(intervalId);
  }, [callback, interval, enabled]);
}