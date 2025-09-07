import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Activity, TrendingUp, Trophy, Settings, BarChart3 } from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useDiamondAdminAPI } from '@/hooks/useDiamondAdminAPI';
import { SportsOverviewCards } from './SportsOverviewCards';
import { SIDManager } from './SIDManager';
import { MatchCard } from './MatchCard';
import { OddsViewer } from './OddsViewer';
import { MatchResultPoster } from './MatchResultPoster';
import { APIExplorer } from './APIExplorer';
import { SportsAnalytics } from './SportsAnalytics';

export const EnhancedLiveSportsIntegration = () => {
  const { toast } = useToast();
  const diamondAPI = useDiamondSportsAPI();
  const adminAPI = useDiamondAdminAPI();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<any[]>([]);
  const [sidConfigs, setSidConfigs] = useState<any[]>([]);
  const [selectedSID, setSelectedSID] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMatches: 0,
    liveMatches: 0,
    totalBets: 0,
    revenue: 0,
    activeUsers: 0,
    upcomingMatches: 0
  });

  // Load SID configurations
  useEffect(() => {
    loadSIDConfigs();
  }, []);

  // Auto-refresh for live data
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'matches' && selectedSID) {
        fetchMatches(selectedSID, true);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [activeTab, selectedSID]);

  const loadSIDConfigs = async () => {
    const configs = await adminAPI.getSIDConfigs();
    setSidConfigs(configs || []);
  };

  const fetchAllSportsIDs = async () => {
    const response = await diamondAPI.getAllSportsId();
    if (response?.data) {
      toast({
        title: "Sports IDs Fetched",
        description: `Found ${response.data.length} available sports`
      });
      return response.data;
    }
    return [];
  };

  const fetchMatches = async (sid: string, silent = false) => {
    if (!sid) return;
    
    if (!silent) setRefreshing(true);
    const response = await diamondAPI.getAllMatch(sid);
    
    if (response?.data) {
      const matchData = Array.isArray(response.data) ? response.data : [response.data];
      setMatches(matchData);
      updateStats(matchData);
      
      if (!silent) {
        toast({
          title: "Matches Loaded",
          description: `Found ${matchData.length} matches`
        });
      }
    }
    setRefreshing(false);
  };

  const updateStats = (matchData: any[]) => {
    const liveCount = matchData.filter(m => m.status === 'live' || m.isLive).length;
    const upcomingCount = matchData.filter(m => m.status === 'upcoming').length;
    
    setStats({
      totalMatches: matchData.length,
      liveMatches: liveCount,
      upcomingMatches: upcomingCount,
      totalBets: Math.floor(Math.random() * 1000), // Mock data - replace with actual
      revenue: Math.floor(Math.random() * 100000), // Mock data - replace with actual
      activeUsers: Math.floor(Math.random() * 100) // Mock data - replace with actual
    });
  };

  const handleToggleBetting = async (matchId: string, enabled: boolean) => {
    try {
      await adminAPI.manageSID({
        sport_type: 'cricket', // Get from match data
        sid: matchId,
        is_active: enabled,
        auto_sync: false,
        sync_interval: 60
      });
      
      toast({
        title: enabled ? "Betting Enabled" : "Betting Disabled",
        description: `Betting has been ${enabled ? 'enabled' : 'disabled'} for this match`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update betting status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Live Sports Integration
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage Diamond Sports API integration and live betting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="h-3 w-3 mr-1" />
            {stats.liveMatches} Live
          </Badge>
          <Button 
            onClick={() => selectedSID && fetchMatches(selectedSID)} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <SportsOverviewCards stats={stats} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sids">
            <Settings className="h-4 w-4 mr-2" />
            SID Config
          </TabsTrigger>
          <TabsTrigger value="matches">
            <Activity className="h-4 w-4 mr-2" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="odds">
            <TrendingUp className="h-4 w-4 mr-2" />
            Odds
          </TabsTrigger>
          <TabsTrigger value="results">
            <Trophy className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="explorer">
            API Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SportsAnalytics matches={matches} />
        </TabsContent>

        <TabsContent value="sids">
          <SIDManager 
            configs={sidConfigs}
            loading={adminAPI.loading}
            onSave={async (config) => {
              await adminAPI.manageSID(config);
              await loadSIDConfigs();
            }}
            onDelete={async (id) => {
              await adminAPI.deleteSID(id);
              await loadSIDConfigs();
            }}
            onFetchSports={fetchAllSportsIDs}
          />
        </TabsContent>

        <TabsContent value="matches">
          <div className="space-y-4">
            {/* SID Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Sport ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {sidConfigs.filter(c => c.is_active).map(config => (
                    <Button
                      key={config.id}
                      variant={selectedSID === config.sid ? "default" : "outline"}
                      onClick={() => {
                        setSelectedSID(config.sid);
                        fetchMatches(config.sid);
                      }}
                    >
                      {config.sport_type} (SID: {config.sid})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Matches Grid */}
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match, idx) => (
                  <MatchCard
                    key={match.id || idx}
                    match={match}
                    onToggleBetting={handleToggleBetting}
                    onViewDetails={(m) => console.log('View details:', m)}
                    onViewOdds={(id) => console.log('View odds:', id)}
                    onPostResult={(m) => console.log('Post result:', m)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {selectedSID ? 'No matches found for this SID' : 'Select a Sport ID to view matches'}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="odds">
          <OddsViewer matches={matches} />
        </TabsContent>

        <TabsContent value="results">
          <MatchResultPoster matches={matches} onPostResult={async (result) => {
            await adminAPI.postMatchResult(result);
          }} />
        </TabsContent>

        <TabsContent value="explorer">
          <APIExplorer 
            onTest={adminAPI.testEndpoint}
            logs={[]} // Will be populated from API
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};