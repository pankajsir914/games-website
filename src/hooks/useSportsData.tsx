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

export function useSportsData(sport: string, kind: 'live' | 'upcoming' | 'results') {
  const [data, setData] = useState<SportsMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!sport || !kind) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const { data: cachedData } = await supabase
          .from('sports_matches_cache')
          .select('match_data, expires_at')
          .eq('sport_type', sport)
          .eq('match_kind', kind)
          .gt('expires_at', new Date().toISOString());
        
        if (cachedData && cachedData.length > 0) {
          const matches = cachedData.map(item => item.match_data as unknown as SportsMatch);
          setData(matches);
          setLastRefresh(new Date());
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const { data: apiData, error: apiError } = await supabase.functions.invoke('sports-proxy', {
        body: { sport, kind, date: null, team: '' }
      });

      if (apiError) throw new Error(apiError.message);
      
      const matches = apiData?.items || [];
      setData(matches);
      setLastRefresh(new Date());

      // Cache the results
      const cacheData = matches.map((match: SportsMatch) => ({
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
      setLoading(false);
    }
  }, [sport, kind]);

  const refresh = () => fetchData(true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, lastRefresh };
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