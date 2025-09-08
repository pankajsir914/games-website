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

  // Fetch matches for selected sport
  const fetchMatches = useCallback(async (sport?: SportConfig) => {
    const targetSport = sport || selectedSport;
    if (!targetSport) return;

    setLoading(true);
    setError(null);

    try {
      // Call the edge function with the SID
      const { data: response, error: fnError } = await supabase.functions.invoke('sports-diamond-proxy', {
        body: {
          path: 'sports/esid',
          sid: targetSport.sid
        }
      });

      if (fnError) throw fnError;

      if (response?.success && response?.data) {
        // Parse the response - Diamond API returns an array of matches
        const rawMatches = Array.isArray(response.data) ? response.data : [];
        
        const parsedMatches: SportMatch[] = rawMatches.map((match: any) => ({
          id: match.eventId || match.id || Math.random().toString(),
          name: match.name || `${match.team1} vs ${match.team2}`,
          team1: match.team1 || match.home || 'Team A',
          team2: match.team2 || match.away || 'Team B',
          score: match.score || match.result || '',
          status: match.status || (match.isLive ? 'live' : 'upcoming'),
          date: match.date || match.eventDate || new Date().toISOString(),
          time: match.time || match.eventTime,
          isLive: match.isLive || match.status === 'live',
          eventId: match.eventId || match.id
        }));

        setMatches(parsedMatches);
        
        if (parsedMatches.length === 0) {
          toast.info(`No matches found for ${targetSport.label}`);
        }
      } else if (response?.error?.includes('429')) {
        // Rate limited
        setError('API rate limit reached. Please try again in a few minutes.');
        toast.error('Too many requests. Please wait a moment.');
      } else {
        setError('Failed to fetch matches');
        toast.error('Failed to load matches');
      }
    } catch (err: any) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Failed to fetch matches');
      toast.error('Error loading matches');
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

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