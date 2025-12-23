import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SportConfig {
  id: string;
  sport_type: string;
  sid: string;
  label: string;
  icon?: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
}

export interface SportMatch {
  id: string;
  name: string;
  team1: string;
  team2: string;
  score?: string;
  status: string;
  date: string;
  time?: string;
  isLive?: boolean;
  eventId?: string;
  league?: string;
  cname?: string;
}

export function useSimpleSportsData() {
  const [sports, setSports] = useState<SportConfig[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportConfig | null>(null);
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sports configurations from database
  const loadSports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sports_sid_configs')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      if (data && data.length > 0) {
        setSports(data);
        
        // Auto-select default sport
        const defaultSport = data.find(s => s.is_default) || data[0];
        if (!selectedSport && defaultSport) {
          setSelectedSport(defaultSport);
        }
      } else {
        // Fallback if database is empty
        const fallbackSports: SportConfig[] = [
          { id: '1', sport_type: 'cricket', sid: '4', label: 'Cricket', icon: '🏏', is_active: true, is_default: true, display_order: 1 },
          { id: '2', sport_type: 'football', sid: '1', label: 'Football', icon: '⚽', is_active: true, is_default: false, display_order: 2 },
          { id: '3', sport_type: 'tennis', sid: '2', label: 'Tennis', icon: '🎾', is_active: true, is_default: false, display_order: 3 },
        ];
        setSports(fallbackSports);
        setSelectedSport(fallbackSports[0]);
      }
    } catch (err: any) {
      console.error('Error loading sports:', err);
      setError(err.message);
      
      // Use fallback sports on error
      const fallbackSports: SportConfig[] = [
        { id: '1', sport_type: 'cricket', sid: '4', label: 'Cricket', icon: '🏏', is_active: true, is_default: true, display_order: 1 },
        { id: '2', sport_type: 'football', sid: '1', label: 'Football', icon: '⚽', is_active: true, is_default: false, display_order: 2 },
      ];
      setSports(fallbackSports);
      setSelectedSport(fallbackSports[0]);
    }
  }, [selectedSport]);

  // Local storage cache
  const getCachedMatches = useCallback((sportId: string): SportMatch[] | null => {
    try {
      const cached = localStorage.getItem(`sports_matches_${sportId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < maxAge) {
          return data;
        }
      }
    } catch (err) {
      console.error('Error reading cache:', err);
    }
    return null;
  }, []);

  const setCachedMatches = useCallback((sportId: string, matches: SportMatch[]) => {
    try {
      localStorage.setItem(`sports_matches_${sportId}`, JSON.stringify({
        data: matches,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error setting cache:', err);
    }
  }, []);

  // Fetch matches for selected sport from API
  const fetchMatches = useCallback(async (sport?: SportConfig) => {
    const targetSport = sport || selectedSport;
    if (!targetSport) return;

    setLoading(true);
    setError(null);

    // Check local cache first
    const cachedData = getCachedMatches(targetSport.id);
    if (cachedData && cachedData.length > 0) {
      setMatches(cachedData);
    }

    let allMatches: SportMatch[] = [];
    let success = false;
    let lastError: any = null;

    // Strategy 1: Try Supabase sports-proxy function (supports multiple sports)
    try {
      console.log(`Fetching ${targetSport.sport_type} matches from sports-proxy API...`);
      
      // Fetch live, upcoming, and results in parallel
      const [liveResponse, upcomingResponse, resultsResponse] = await Promise.allSettled([
        supabase.functions.invoke('sports-proxy', {
          body: { sport: targetSport.sport_type, kind: 'live' }
        }),
        supabase.functions.invoke('sports-proxy', {
          body: { sport: targetSport.sport_type, kind: 'upcoming' }
        }),
        supabase.functions.invoke('sports-proxy', {
          body: { sport: targetSport.sport_type, kind: 'results' }
        })
      ]);

      // Process live matches
      if (liveResponse.status === 'fulfilled' && liveResponse.value.data && !liveResponse.value.error) {
        const liveData = liveResponse.value.data.items || liveResponse.value.data.data || [];
        const liveMatches = liveData.map((item: any) => ({
          id: item.id || `live_${Math.random().toString(36).substr(2, 9)}`,
          name: `${item.teams?.home || 'Team A'} vs ${item.teams?.away || 'Team B'}`,
          team1: item.teams?.home || 'Team A',
          team2: item.teams?.away || 'Team B',
          score: item.scores ? `${item.scores.home || 0}-${item.scores.away || 0}` : '',
          status: 'live',
          date: item.date || new Date().toISOString(),
          time: item.time,
          isLive: true,
          eventId: item.id,
          league: item.league?.name || item.league || item.cname || item.competition || selectedSport?.label,
          cname: item.cname
        }));
        allMatches = [...allMatches, ...liveMatches];
      }

      // Process upcoming matches
      if (upcomingResponse.status === 'fulfilled' && upcomingResponse.value.data && !upcomingResponse.value.error) {
        const upcomingData = upcomingResponse.value.data.items || upcomingResponse.value.data.data || [];
        const upcomingMatches = upcomingData.map((item: any) => ({
          id: item.id || `upcoming_${Math.random().toString(36).substr(2, 9)}`,
          name: `${item.teams?.home || 'Team A'} vs ${item.teams?.away || 'Team B'}`,
          team1: item.teams?.home || 'Team A',
          team2: item.teams?.away || 'Team B',
          score: '',
          status: 'upcoming',
          date: item.date || new Date().toISOString(),
          time: item.time,
          isLive: false,
          eventId: item.id,
          league: item.league?.name || item.league || item.cname || item.competition || selectedSport?.label,
          cname: item.cname
        }));
        allMatches = [...allMatches, ...upcomingMatches];
      }

      // Process results
      if (resultsResponse.status === 'fulfilled' && resultsResponse.value.data && !resultsResponse.value.error) {
        const resultsData = resultsResponse.value.data.items || resultsResponse.value.data.data || [];
        const resultMatches = resultsData.slice(0, 20).map((item: any) => ({
          id: item.id || `result_${Math.random().toString(36).substr(2, 9)}`,
          name: `${item.teams?.home || 'Team A'} vs ${item.teams?.away || 'Team B'}`,
          team1: item.teams?.home || 'Team A',
          team2: item.teams?.away || 'Team B',
          score: item.scores ? `${item.scores.home || 0}-${item.scores.away || 0}` : '',
          status: 'finished',
          date: item.date || new Date().toISOString(),
          time: item.time,
          isLive: false,
          eventId: item.id,
          league: item.league?.name || item.league || item.cname || item.competition || selectedSport?.label,
          cname: item.cname
        }));
        allMatches = [...allMatches, ...resultMatches];
      }

      if (allMatches.length > 0) {
        success = true;
        console.log(`Successfully fetched ${allMatches.length} matches from sports-proxy API`);
      }
    } catch (err: any) {
      console.error('Error fetching from sports-proxy:', err);
      lastError = err;
    }

    // Strategy 2: Fallback to Diamond API (sports-diamond-proxy) if sports-proxy fails
    if (!success && targetSport.sid) {
      try {
        console.log(`Trying Diamond API (sports-diamond-proxy) for ${targetSport.sport_type} with SID ${targetSport.sid}...`);
        
        // Call sports-diamond-proxy with action=esid and sid parameter
        const { data: response, error: fnError } = await supabase.functions.invoke('sports-diamond-proxy', {
          body: {
            action: 'esid',
            sid: targetSport.sid
          }
        });

        if (!fnError && response?.success && response?.data) {
          console.log('Diamond API response:', response);
          
          let rawMatches: any[] = [];
          
          // Handle Diamond API's nested response structure (cricket/other sports can differ)
          const candidates = [
            response.data?.data?.t1,
            response.data?.data?.t2,
            response.data?.t1,
            response.data?.t2,
            response.data?.data,
            response.data
          ];

          for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) {
              rawMatches = c;
              break;
            }
            // Sometimes data is an object with first array value
            if (c && !Array.isArray(c) && typeof c === 'object') {
              const firstArray = Object.values(c).find(v => Array.isArray(v)) as any[] | undefined;
              if (firstArray && firstArray.length > 0) {
                rawMatches = firstArray;
                break;
              }
            }
          }

          console.log('Diamond raw matches count:', rawMatches.length);
          
          if (rawMatches.length === 0) {
            console.warn('No matches extracted from Diamond response', response.data);
          }
          
          const parsedMatches: SportMatch[] = rawMatches.map((match: any) => {
            let team1 = 'Team A';
            let team2 = 'Team B';
            
            // Extract teams from section array (Diamond API structure)
            if (match.section && Array.isArray(match.section)) {
              const teams = match.section.filter((item: any) => item?.nat);
              if (teams.length >= 2) {
                team1 = teams[0].nat || team1;
                team2 = teams[1].nat || team2;
              } else if (teams.length === 1) {
                team1 = teams[0].nat || team1;
                team2 = match.section[2]?.nat || match.section[1]?.nat || team2;
              }
            } 
            
            // Check ename field which often contains "Team1 vs Team2" format
            if (match.ename && match.ename.includes(' vs ')) {
              const [t1, t2] = match.ename.split(' vs ').map((t: string) => t.trim());
              if (t1) team1 = t1;
              if (t2) team2 = t2;
            } else if (match.ename && match.ename.includes(' - ')) {
              const [t1, t2] = match.ename.split(' - ').map((t: string) => t.trim());
              if (t1) team1 = t1;
              if (t2) team2 = t2;
            }
            
            // Final fallback to other possible field names
            team1 = team1 === 'Team A' ? (match.team1 || match.home || team1) : team1;
            team2 = team2 === 'Team B' ? (match.team2 || match.away || team2) : team2;
            
            // Determine if match is live
            const isLiveMatch = match.iplay === true || match.iplay === 1 || match.status === 'live' || match.status === 'Live';
            
            // Determine status - check if match is finished/past
            let matchStatus = 'upcoming'; // Default to upcoming
            const matchStatusLower = (match.status || '').toLowerCase();
            
            if (isLiveMatch) {
              matchStatus = 'live';
            } else if (
              matchStatusLower.includes('finished') ||
              matchStatusLower.includes('result') ||
              matchStatusLower.includes('completed') ||
              matchStatusLower.includes('ended') ||
              matchStatusLower.includes('ft') ||
              matchStatusLower.includes('won')
            ) {
              matchStatus = 'finished';
            } else if (
              matchStatusLower.includes('upcoming') ||
              matchStatusLower.includes('scheduled') ||
              matchStatusLower.includes('not started') ||
              matchStatusLower.includes('ns')
            ) {
              matchStatus = 'upcoming';
            } else {
              // If no clear status, check if there's a score without live flag = likely finished
              const hasScore = match.score || match.result || (match.section?.find((s: any) => s.score)?.score);
              matchStatus = hasScore ? 'finished' : 'upcoming';
            }
            
            return {
              id: match.gmid || match.eventId || match.id || Math.random().toString(),
              name: match.ename || match.name || `${team1} vs ${team2}`,
              team1,
              team2,
              score: match.score || match.result || (match.section?.find((s: any) => s.score)?.score) || '',
              status: matchStatus,
              date: match.stime || match.date || match.eventDate || new Date().toISOString(),
              time: match.time || match.eventTime,
              isLive: isLiveMatch,
              eventId: match.gmid || match.eventId || match.id,
              league: match.cname || match.league || match.tour || selectedSport?.label,
              cname: match.cname
            };
          });

          allMatches = parsedMatches;
          success = true;
          console.log(`Successfully fetched ${parsedMatches.length} matches from Diamond API (sports-diamond-proxy)`);
        } else {
          console.error('Diamond API error:', fnError || response?.error);
          lastError = fnError || response?.error;
        }
      } catch (err: any) {
        console.error('Error fetching from Diamond API (sports-diamond-proxy):', err);
        lastError = err;
      }
    }

    // Strategy 3: Try server-side API as last resort (if available)
    if (!success) {
      try {
        console.log(`Trying server API for ${targetSport.sport_type}...`);
        const { apiFetch } = await import('@/lib/api');
        
        // Map sport types to server API supported sports
        const serverSportMap: Record<string, string> = {
          'cricket': 'cricket',
          'football': 'football',
          'hockey': 'hockey'
        };
        
        const serverSport = serverSportMap[targetSport.sport_type];
        if (serverSport) {
          const [liveRes, upcomingRes] = await Promise.allSettled([
            apiFetch(`/api/${serverSport}/live`),
            apiFetch(`/api/${serverSport}/upcoming`)
          ]);

          if (liveRes.status === 'fulfilled' && liveRes.value.ok) {
            const liveData = await liveRes.value.json();
            const liveMatches = (liveData.items || []).map((item: any) => ({
              id: item.id || `server_live_${Math.random().toString(36).substr(2, 9)}`,
              name: `${item.teams?.home || 'Team A'} vs ${item.teams?.away || 'Team B'}`,
              team1: item.teams?.home || 'Team A',
              team2: item.teams?.away || 'Team B',
              score: item.scores ? `${item.scores.home || 0}-${item.scores.away || 0}` : '',
              status: 'live',
              date: item.date || new Date().toISOString(),
              isLive: true,
              eventId: item.id
            }));
            allMatches = [...allMatches, ...liveMatches];
          }

          if (upcomingRes.status === 'fulfilled' && upcomingRes.value.ok) {
            const upcomingData = await upcomingRes.value.json();
            const upcomingMatches = (upcomingData.items || []).map((item: any) => ({
              id: item.id || `server_upcoming_${Math.random().toString(36).substr(2, 9)}`,
              name: `${item.teams?.home || 'Team A'} vs ${item.teams?.away || 'Team B'}`,
              team1: item.teams?.home || 'Team A',
              team2: item.teams?.away || 'Team B',
              score: '',
              status: 'upcoming',
              date: item.date || new Date().toISOString(),
              isLive: false,
              eventId: item.id
            }));
            allMatches = [...allMatches, ...upcomingMatches];
          }

          if (allMatches.length > 0) {
            success = true;
            console.log(`Successfully fetched ${allMatches.length} matches from server API`);
          }
        }
      } catch (err: any) {
        console.error('Error fetching from server API:', err);
        lastError = err;
      }
    }

    // Update state based on results
    if (success && allMatches.length > 0) {
      setMatches(allMatches);
      setCachedMatches(targetSport.id, allMatches);
      setError(null);
      toast.success(`Loaded ${allMatches.length} matches for ${targetSport.label}`);
    } else if (cachedData && cachedData.length > 0) {
      // Use cached data if API fails
      setMatches(cachedData);
      toast.warning('Using cached data - API temporarily unavailable');
      setError('API temporarily unavailable. Showing cached data.');
    } else {
      // No data available
      setMatches([]);
      setError('Unable to load matches. Please try again later.');
      toast.error('Failed to load matches. API services are temporarily unavailable.');
    }

    setLoading(false);
  }, [selectedSport, getCachedMatches, setCachedMatches]);

  // Initialize on mount
  useEffect(() => {
    loadSports();
  }, []);

  // Fetch matches when sport changes
  useEffect(() => {
    if (selectedSport) {
      fetchMatches(selectedSport);
    }
  }, [selectedSport]);

  const selectSport = (sport: SportConfig) => {
    setSelectedSport(sport);
    setMatches([]); // Clear previous matches
  };

  const refresh = () => {
    if (selectedSport) {
      fetchMatches(selectedSport);
    }
  };

  return {
    sports,
    selectedSport,
    matches,
    loading,
    error,
    selectSport,
    refresh,
    fetchMatches
  };
}
