import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Activity, TrendingUp, Trophy, Settings, BarChart3 } from 'lucide-react';
import { useDiamondSportsData } from '@/hooks/useDiamondSportsData';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { SportsOverviewCards } from './SportsOverviewCards';
import { SIDManager } from './SIDManager';
import { MatchCard } from './MatchCard';
import { OddsViewer } from './OddsViewer';
import { MatchResultPoster } from './MatchResultPoster';
import { APIExplorer } from './APIExplorer';
import { SportsAnalytics } from './SportsAnalytics';
import { useToast } from '@/hooks/use-toast';

const SPORT_ICONS: Record<string, string> = {
  cricket: '🏏',
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  baseball: '⚾',
  kabaddi: '🤼',
  'table-tennis': '🏓',
  boxing: '🥊'
};

export const EnhancedLiveSportsIntegration = () => {
  const { toast } = useToast();
  const sportsData = useDiamondSportsData();
  const diamondAPI = useDiamondSportsAPI();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [apiLogs, setApiLogs] = useState<any[]>([]);

  // Load SID configurations on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const configs = await sportsData.loadSIDConfigs();
      // If we have configs and a default is set, fetch matches for it
      const defaultConfig = configs?.find((c: any) => c.is_default && c.is_active);
      if (defaultConfig) {
        await sportsData.fetchMatches({
          sport_type: defaultConfig.sport_type,
          sid: defaultConfig.sid,
          label: defaultConfig.label,
          is_default: defaultConfig.is_default
        });
      }
    };
    
    loadInitialData();
  }, []);

  // Load API logs when explorer tab is active
  useEffect(() => {
    if (activeTab === 'explorer') {
      loadAPILogs();
    }
  }, [activeTab]);

  const loadAPILogs = async () => {
    const logs = await sportsData.getAPILogs();
    setApiLogs(logs);
  };

  const fetchAllSportsIDs = async () => {
    setRefreshing(true);
    try {
      const response = await diamondAPI.getAllSportsId();
      if (response?.data) {
        toast({
          title: "Sports IDs Fetched",
          description: `Found ${response.data.length} available sports. You can now add them as SID configurations.`
        });
        return response.data;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sports IDs",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
    return [];
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (sportsData.selectedSport) {
      await sportsData.fetchMatches(sportsData.selectedSport);
    }
    setRefreshing(false);
  };

  const handleSportChange = (sportType: string) => {
    const config = sportsData.sidConfigs.find(c => 
      c.sport_type === sportType && c.is_active
    );
    
    if (config) {
      sportsData.setSelectedSport({
        sport_type: config.sport_type,
        sid: config.sid,
        label: config.label,
        is_default: config.is_default
      });
      sportsData.fetchMatches({
        sport_type: config.sport_type,
        sid: config.sid,
        label: config.label,
        is_default: config.is_default
      });
    }
  };

  const handleToggleBetting = async (matchId: string, enabled: boolean) => {
    try {
      // Here you would implement the actual betting toggle logic
      // For now, just show a success message
      toast({
        title: enabled ? "Betting Enabled" : "Betting Disabled",
        description: `Betting has been ${enabled ? 'enabled' : 'disabled'} for match ${matchId}`
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
            {sportsData.stats.liveMatches} Live
          </Badge>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || sportsData.loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <SportsOverviewCards stats={sportsData.stats} />

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
          <SportsAnalytics matches={sportsData.matches} />
        </TabsContent>

        <TabsContent value="sids">
          <SIDManager 
            configs={sportsData.sidConfigs}
            loading={sportsData.loading}
            onSave={async (config) => {
              await sportsData.saveSIDConfig(config);
              await sportsData.loadSIDConfigs();
            }}
            onDelete={async (id) => {
              await sportsData.deleteSIDConfig(id);
              await sportsData.loadSIDConfigs();
            }}
            onFetchSports={fetchAllSportsIDs}
          />
        </TabsContent>

        <TabsContent value="matches">
          <div className="space-y-4">
            {/* Sport Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Sport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Select 
                    value={sportsData.selectedSport?.sport_type || ''} 
                    onValueChange={handleSportChange}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Choose a sport to view matches" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportsData.sidConfigs
                        .filter(c => c.is_active)
                        .map(config => (
                          <SelectItem key={config.id} value={config.sport_type}>
                            <div className="flex items-center gap-2">
                              <span>{SPORT_ICONS[config.sport_type] || '🏆'}</span>
                              <span>{config.sport_type}</span>
                              {config.is_default && (
                                <Badge variant="secondary" className="ml-2 h-5">Default</Badge>
                              )}
                              {config.label && (
                                <span className="text-muted-foreground ml-1">({config.label})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {sportsData.selectedSport && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>SID: {sportsData.selectedSport.sid}</span>
                      {sportsData.selectedSport.label && (
                        <span>• {sportsData.selectedSport.label}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Matches Grid */}
            {sportsData.loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-muted-foreground">Loading matches...</p>
                </CardContent>
              </Card>
            ) : sportsData.matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sportsData.matches.map((match, idx) => (
                  <MatchCard
                    key={match.id || idx}
                    match={match}
                    onToggleBetting={handleToggleBetting}
                    onViewDetails={(m) => console.log('View details:', m)}
                    onViewOdds={async (id) => {
                      const odds = await sportsData.fetchOdds(id);
                      console.log('Odds:', odds);
                    }}
                    onPostResult={(m) => console.log('Post result:', m)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {sportsData.selectedSport 
                    ? 'No matches found for this sport' 
                    : 'Select a sport to view matches'}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="odds">
          <OddsViewer matches={sportsData.matches} />
        </TabsContent>

        <TabsContent value="results">
          <MatchResultPoster 
            matches={sportsData.matches} 
            onPostResult={async (result) => {
              await sportsData.postMatchResult(result);
            }} 
          />
        </TabsContent>

        <TabsContent value="explorer">
          <APIExplorer 
            onTest={sportsData.testEndpoint}
            logs={apiLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};