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

  // Fetch matches for selected sport
  const fetchMatches = useCallback(async (sport?: SportConfig) => {
    const targetSport = sport || selectedSport;
    if (!targetSport) return;

    setLoading(true);
    setError(null);

    // Check local cache first
    const cachedData = getCachedMatches(targetSport.id);
    if (cachedData && cachedData.length > 0) {
      setMatches(cachedData);
      toast.info('Showing cached matches (updating in background)');
    }

    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Try primary API first
        const { data: response, error: fnError } = await supabase.functions.invoke('sports-diamond-proxy', {
          body: {
            path: 'sports/esid',
            sid: targetSport.sid
          }
        });

        if (!fnError && response?.success && response?.data) {
          // Parse the response - Diamond API has nested structure
          let rawMatches = [];
          
          // Handle Diamond API's nested response structure: data.data.t1
          if (response.data?.data?.t1 && Array.isArray(response.data.data.t1)) {
            console.log('Diamond API response structure detected: data.data.t1');
            rawMatches = response.data.data.t1;
          } else if (response.data?.t1 && Array.isArray(response.data.t1)) {
            console.log('Diamond API response structure detected: data.t1');
            rawMatches = response.data.t1;
          } else if (Array.isArray(response.data)) {
            console.log('Direct array structure detected');
            rawMatches = response.data;
          }
          
          console.log(`Processing ${rawMatches.length} matches from Diamond API`);
          
          const parsedMatches: SportMatch[] = rawMatches.map((match: any) => {
            // Extract teams from section array (Diamond API structure)
            let team1 = 'Team A';
            let team2 = 'Team B';
            
            if (match.section && Array.isArray(match.section)) {
              // Diamond API structure: section[0].nat is team1, section[2].nat is team2
              team1 = match.section[0]?.nat || team1;
              team2 = match.section[2]?.nat || team2;
            } else {
              // Fallback to other possible field names
              team1 = match.team1 || match.home || team1;
              team2 = match.team2 || match.away || team2;
            }
            
            return {
              id: match.gmid || match.eventId || match.id || Math.random().toString(),
              name: match.ename || match.name || `${team1} vs ${team2}`,
              team1,
              team2,
              score: match.score || match.result || '',
              status: match.iplay ? 'live' : (match.status || 'upcoming'),
              date: match.stime || match.date || match.eventDate || new Date().toISOString(),
              time: match.time || match.eventTime,
              isLive: match.iplay === true || match.status === 'live',
              eventId: match.gmid || match.eventId || match.id
            };
          });

          setMatches(parsedMatches);
          setCachedMatches(targetSport.id, parsedMatches);
          
          if (parsedMatches.length === 0) {
            toast.info(`No matches found for ${targetSport.label}`);
          }
          
          setError(null);
          break; // Success, exit loop
        }

        // If rate limited or error, try fallback
        if (response?.error?.includes('429') || response?.error || fnError) {
          lastError = response?.error || fnError;
          
          if (attempts === 1) {
            console.log('Primary API failed, trying fallback...');
            
            // Don't use fallback mock data, just show error
            setMatches([]);
            setError('Sports data service is temporarily unavailable. Please try again later.');
            toast.warning('API rate limit reached. Please wait a moment and try again.', {
              duration: 5000
            });
            break;
          }
        }
      } catch (err: any) {
        console.error(`Attempt ${attempts} failed:`, err);
        lastError = err;
      }
    }

    // If all attempts failed and no cached data
    if (attempts >= maxAttempts && (!cachedData || cachedData.length === 0)) {
      setError('Unable to load matches. Please try again later.');
      toast.error('Failed to load matches. API services are temporarily unavailable.');
      
      // Use fallback mock data as last resort
      const fallbackMatches: SportMatch[] = [
        {
          id: 'fallback1',
          name: 'Sample Match 1',
          team1: 'Team A',
          team2: 'Team B',
          score: '',
          status: 'upcoming',
          date: new Date().toISOString(),
          time: '15:00',
          isLive: false,
        },
        {
          id: 'fallback2',
          name: 'Sample Match 2',
          team1: 'Team C',
          team2: 'Team D',
          score: '1-0',
          status: 'live',
          date: new Date().toISOString(),
          isLive: true,
        }
      ];
      setMatches(fallbackMatches);
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