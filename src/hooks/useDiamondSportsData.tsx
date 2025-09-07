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
      const configs = await adminAPI.getSIDConfigs();
      setSidConfigs(configs || []);
      
      // Auto-select default SID if available
      const defaultConfig = configs?.find(c => c.is_default && c.is_active);
      if (defaultConfig && !selectedSport) {
        setSelectedSport({
          sport_type: defaultConfig.sport_type,
          sid: defaultConfig.sid,
          label: defaultConfig.label,
          is_default: defaultConfig.is_default
        });
      }
      
      return configs;
    } catch (error) {
      console.error('Failed to load SID configs:', error);
      return [];
    }
  }, [adminAPI, selectedSport]);
  
  // Fetch matches using selected SID
  const fetchMatches = useCallback(async (sport?: SportWithSID, silent = false) => {
    const targetSport = sport || selectedSport;
    
    if (!targetSport?.sid) {
      if (!silent) {
        toast({
          title: "No SID Selected",
          description: "Please select a sport configuration to fetch matches",
          variant: "destructive"
        });
      }
      return [];
    }
    
    if (!silent) setLoading(true);
    
    try {
      const response = await diamondAPI.getAllMatch(targetSport.sid);
      
      if (response?.data) {
        const matchData = Array.isArray(response.data) ? response.data : [response.data];
        
        // Enrich matches with sport type
        const enrichedMatches = matchData.map(match => ({
          ...match,
          sport_type: targetSport.sport_type,
          sid: targetSport.sid
        }));
        
        setMatches(enrichedMatches);
        
        if (!silent) {
          toast({
            title: "Matches Loaded",
            description: `Found ${enrichedMatches.length} ${targetSport.sport_type} matches`
          });
        }
        
        return enrichedMatches;
      }
      
      return [];
    } catch (error: any) {
      if (!silent) {
        toast({
          title: "Failed to fetch matches",
          description: error.message || "Could not load match data",
          variant: "destructive"
        });
      }
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
    setSelectedSport,
    
    // SID Management
    saveSIDConfig: adminAPI.manageSID,
    deleteSIDConfig: adminAPI.deleteSID,
    
    // API Testing
    testEndpoint: adminAPI.testEndpoint,
    getAPILogs: adminAPI.getAPILogs,
    
    // Match Results
    postMatchResult: adminAPI.postMatchResult,
    getMatchResults: adminAPI.getMatchResults
  };
}