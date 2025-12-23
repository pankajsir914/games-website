import { useState, useCallback, useEffect } from 'react';
import { useDiamondSportsAPI } from './useDiamondSportsAPI';
import { useDiamondAdminAPI } from './useDiamondAdminAPI';
import { useToast } from '@/hooks/use-toast';

export interface SportWithSID {
  sport_type: string;
  sid: string;
  label?: string;
  is_default?: boolean;
}

export function useDiamondSportsData() {
  const { toast } = useToast();
  const diamondAPI = useDiamondSportsAPI();
  const adminAPI = useDiamondAdminAPI();
  
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [sidConfigs, setSidConfigs] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportWithSID | null>(null);
  
  // Load SID configurations from database
  const loadSIDConfigs = useCallback(async () => {
    try {
      console.log('Loading SID configurations...');
      const configs = await adminAPI.getSIDConfigs();
      console.log('Loaded SID configs:', configs);
      
      // Use fallback if no configs found
      const finalConfigs = configs && configs.length > 0 ? configs : [
        { sport_type: 'cricket', sid: '4', label: 'Cricket', is_active: true, is_default: true },
        { sport_type: 'football', sid: '1', label: 'Football', is_active: true, is_default: false },
        { sport_type: 'tennis', sid: '2', label: 'Tennis', is_active: true, is_default: false },
        { sport_type: 'basketball', sid: '7', label: 'Basketball', is_active: true, is_default: false },
        { sport_type: 'hockey', sid: '8', label: 'Hockey', is_active: true, is_default: false }
      ];
      
      setSidConfigs(finalConfigs);
      
      // Auto-select default SID if available and no sport selected
      if (!selectedSport) {
        const defaultConfig = finalConfigs.find(c => c.is_default && c.is_active);
        if (defaultConfig) {
          setSelectedSport({
            sport_type: defaultConfig.sport_type,
            sid: defaultConfig.sid,
            label: defaultConfig.label,
            is_default: defaultConfig.is_default
          });
        }
      }
      
      return finalConfigs;
    } catch (error) {
      console.error('Failed to load SID configs:', error);
      // Return fallback configs on error
      const fallbackConfigs = [
        { sport_type: 'cricket', sid: '4', label: 'Cricket', is_active: true, is_default: true },
        { sport_type: 'football', sid: '1', label: 'Football', is_active: true, is_default: false },
        { sport_type: 'tennis', sid: '2', label: 'Tennis', is_active: true, is_default: false },
        { sport_type: 'basketball', sid: '7', label: 'Basketball', is_active: true, is_default: false },
        { sport_type: 'hockey', sid: '8', label: 'Hockey', is_active: true, is_default: false }
      ];
      setSidConfigs(fallbackConfigs);
      return fallbackConfigs;
    }
  }, [adminAPI, selectedSport]);
  
  // Fetch matches using selected SID
  const fetchMatches = useCallback(async (sport?: SportWithSID, silent = false) => {
    const targetSport = sport || selectedSport;
    
    if (!targetSport?.sid) {
      if (!silent) {
        toast({
          title: "No SID Configured",
          description: "Please configure a SID for this sport in the SIDs tab",
          variant: "destructive"
        });
      }
      setMatches([]);
      return [];
    }
    
    if (!silent) setLoading(true);
    
    try {
      console.log('Fetching matches for', targetSport.sport_type, 'with SID:', targetSport.sid);
      const response = await diamondAPI.getAllMatch(targetSport.sid);
      
      console.log('Diamond API response structure:', response);
      
      if (response?.success && response?.data) {
        // Check if API returned an error in the data
        if (response.data.status === false || response.data.error) {
          console.error('Diamond API error in response:', response.data);
          throw new Error(response.data.error || 'API returned error status');
        }
        
        // Handle different data structures from the API
        let matchData = response.data;
        
        // Diamond API structure: data.t1 array contains matches
        if (matchData.data?.t1 && Array.isArray(matchData.data.t1)) {
          console.log('Diamond API response: found data.data.t1 structure');
          matchData = matchData.data.t1;
        }
        // If data is nested in a 'data' property
        else if (matchData.data && Array.isArray(matchData.data)) {
          matchData = matchData.data;
        }
        // If data has 't1' property (another Diamond API structure)
        else if (matchData.t1 && Array.isArray(matchData.t1)) {
          matchData = matchData.t1;
        }
        // If data has 'matches' property
        else if (matchData.matches && Array.isArray(matchData.matches)) {
          matchData = matchData.matches;
        }
        
        // Ensure we have an array
        if (!Array.isArray(matchData)) {
          console.warn('Match data is not an array, attempting to convert:', matchData);
          matchData = Object.values(matchData).filter((item): item is Record<string, any> => 
            typeof item === 'object' && item !== null && 'gmid' in item
          );
        }
        
        console.log('Processing', matchData.length, 'matches from Diamond API');
        
        // Enrich matches with sport type
        const enrichedMatches = matchData.map((match: any) => ({
          ...match,
          sport_type: targetSport.sport_type,
          sid: targetSport.sid
        }));
        
        setMatches(enrichedMatches);
        
        if (!silent) {
          if (enrichedMatches.length > 0) {
            toast({
              title: "Matches Loaded",
              description: `Found ${enrichedMatches.length} ${targetSport.sport_type} matches`
            });
          } else {
            toast({
              title: "No Matches",
              description: `No matches available for ${targetSport.sport_type}`,
              variant: "default"
            });
          }
        }
        
        return enrichedMatches;
      } else {
        const errorMsg = response?.error || 'No data received from API';
        console.error('API error:', errorMsg);
        
        if (!silent) {
          toast({
            title: "Failed to load matches",
            description: errorMsg,
            variant: "destructive"
          });
        }
        setMatches([]);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      if (!silent) {
        toast({
          title: "Connection Error",
          description: error.message || "Could not connect to sports API",
          variant: "destructive"
        });
      }
      setMatches([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedSport, diamondAPI, toast]);
  
  // Fetch matches for a specific sport type
  const fetchSportMatches = useCallback(async (sportType: string, silent = false) => {
    const config = sidConfigs.find(c => c.sport_type === sportType && c.is_active);
    
    if (!config) {
      if (!silent) {
        toast({
          title: "No Configuration Found",
          description: `No active SID configuration found for ${sportType}`,
          variant: "destructive"
        });
      }
      return [];
    }
    
    const sport: SportWithSID = {
      sport_type: config.sport_type,
      sid: config.sid,
      label: config.label,
      is_default: config.is_default
    };
    
    setSelectedSport(sport);
    return fetchMatches(sport, silent);
  }, [sidConfigs, fetchMatches, toast]);
  
  // Get odds for a match
  const fetchOdds = useCallback(async (eventId: string) => {
    try {
      const response = await diamondAPI.getOdds(eventId);
      return response?.data || null;
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      return null;
    }
  }, [diamondAPI]);

  // WebSocket connection for real-time data (odds, scores, match info)
  const connectOddsWebSocket = useCallback((
    eventId: string, 
    callbacks: {
      onOddsUpdate?: (odds: any) => void;
      onScoreUpdate?: (score: any) => void;
      onMatchInfoUpdate?: (matchInfo: any) => void;
    }
  ) => {
    const sid = sidConfigs.find(c => c.sport_type === selectedSport?.sport_type)?.sid || '4';
    const ws = new WebSocket(
      `wss://foiojihgpeehvpwejeqw.supabase.co/functions/v1/sports-odds-websocket?matchId=${eventId}&sid=${sid}`
    );

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'odds_update' && callbacks.onOddsUpdate) {
          callbacks.onOddsUpdate(message.data);
        } else if (message.type === 'score_update' && callbacks.onScoreUpdate) {
          callbacks.onScoreUpdate(message.data);
        } else if (message.type === 'match_info_update' && callbacks.onMatchInfoUpdate) {
          callbacks.onMatchInfoUpdate(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }, [selectedSport, sidConfigs]);
  
  // Auto-refresh for live matches
  useEffect(() => {
    if (!selectedSport?.sid) return;
    
    const hasLiveMatches = matches.some(m => 
      m.status === 'live' || m.isLive || m.matchStatus === 'LIVE'
    );
    
    if (!hasLiveMatches) return;
    
    const interval = setInterval(() => {
      fetchMatches(selectedSport, true);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [selectedSport, matches, fetchMatches]);
  
  // Get stats from matches
  const getStats = useCallback(() => {
    const liveCount = matches.filter(m => 
      m.status === 'live' || m.isLive || m.matchStatus === 'LIVE'
    ).length;
    
    const upcomingCount = matches.filter(m => 
      m.status === 'upcoming' || m.matchStatus === 'UPCOMING'
    ).length;
    
    const completedCount = matches.filter(m => 
      m.status === 'completed' || m.matchStatus === 'COMPLETED'
    ).length;
    
    return {
      totalMatches: matches.length,
      liveMatches: liveCount,
      upcomingMatches: upcomingCount,
      completedMatches: completedCount,
      totalBets: 0, // Will be populated from database
      revenue: 0, // Will be populated from database
      activeUsers: 0 // Will be populated from database
    };
  }, [matches]);
  
  return {
    // Data
    matches,
    sidConfigs,
    selectedSport,
    loading: loading || adminAPI.loading,
    stats: getStats(),
    
    // Actions
    loadSIDConfigs,
    fetchMatches,
    fetchSportMatches,
    fetchOdds,
    connectOddsWebSocket,
    setSelectedSport,
    
    // SID Management
    saveSIDConfig: adminAPI.manageSID,
    deleteSIDConfig: adminAPI.deleteSID,
    
    // API Testing
    testEndpoint: adminAPI.testEndpoint,
    getAPILogs: adminAPI.getAPILogs,
    storeAPIResponse: adminAPI.storeAPIResponse,
    getStoredResponses: adminAPI.getStoredResponses,
    deleteStoredResponse: adminAPI.deleteStoredResponse,
    
    // Match Results
    postMatchResult: adminAPI.postMatchResult,
    getMatchResults: adminAPI.getMatchResults
  };
}
