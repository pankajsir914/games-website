import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Plus, Trash2, Edit, AlertCircle, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  PlayCircle, 
  PauseCircle, 
  Settings, 
  Wifi,
  WifiOff,
  Calendar,
  Clock,
  Users,
  Target,
  TrendingUp,
  Globe,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface MatchBettingSettings {
  matchId: string;
  sportType: string;
  bettingEnabled: boolean;
  minBet: number;
  maxBet: number;
  commissionRate: number;
}

export const LiveSportsIntegration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('live-data');
  const [liveData, setLiveData] = useState<any>(null);
  const [upcomingData, setUpcomingData] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [matchSettings, setMatchSettings] = useState<Record<string, MatchBettingSettings>>({});
  const [isManageMatchOpen, setIsManageMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [bettingConfig, setBettingConfig] = useState({
    bettingEnabled: false,
    minBet: 10,
    maxBet: 10000,
    commissionRate: 0.05
  });
  const [providerSettings, setProviderSettings] = useState({
    name: '',
    sport: '',
    endpoint: '',
    apiKey: '',
    autoSync: false
  });
  const [isAddProviderDialogOpen, setIsAddProviderDialogOpen] = useState(false);

  const [sportsProviders, setSportsProviders] = useState([
    {
      id: 1,
      name: 'EntitySport',
      sport: 'Cricket',
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 99.9,
      cost: 'Premium',
      endpoint: 'https://restapi.entitysport.com/v2'
    },
    {
      id: 2,
      name: 'SportMonks',
      sport: 'Cricket',
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 99.8,
      cost: 'Premium',
      endpoint: 'https://cricket.sportmonks.com/api/v2.0'
    },
    {
      id: 3,
      name: 'CricAPI',
      sport: 'Cricket', 
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 98.8,
      cost: 'Free Tier',
      endpoint: 'https://api.cricapi.com/v1'
    },
    {
      id: 4,
      name: 'API-SPORTS (Football)',
      sport: 'Football',
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 99.5,
      cost: 'Free Tier',
      endpoint: 'https://api-football-v1.p.rapidapi.com/v3'
    },
    {
      id: 5,
      name: 'API-SPORTS (Hockey)',
      sport: 'Hockey',
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 99.2,
      cost: 'Free Tier',
      endpoint: 'https://api-hockey-v1.p.rapidapi.com/v1'
    }
  ]);

  // Fetch live sports data
  const fetchSportsData = async (sport: string, type: 'live' | 'upcoming' | 'results') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sports-proxy', {
        body: { sport, kind: type }
      });

      if (error) throw error;

      switch (type) {
        case 'live':
          setLiveData(data);
          break;
        case 'upcoming':
          setUpcomingData(data);
          break;
        case 'results':
          setResultsData(data);
          break;
      }

      // Update provider last sync
      setSportsProviders(prev => prev.map(provider => 
        provider.sport.toLowerCase() === sport.toLowerCase() 
          ? { ...provider, lastSync: 'Just now', events: data?.items?.length || 0 }
          : provider
      ));
      
      // Load match settings from database
      await loadMatchSettings(sport);

      toast({
        title: "Data Updated",
        description: `${sport} ${type} data fetched successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to fetch ${sport} ${type} data`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load match betting settings from database
  const loadMatchSettings = async (sport: string) => {
    try {
      const { data, error } = await supabase.rpc('get_match_betting_settings', { p_sport_type: sport });
      
      if (error) throw error;
      
      // Check if data is an object with matches property
      const matchData = data as any;
      if (matchData?.matches && Array.isArray(matchData.matches)) {
        const settings: Record<string, MatchBettingSettings> = {};
        matchData.matches.forEach((match: any) => {
          settings[match.match_id] = {
            matchId: match.match_id,
            sportType: match.sport_type,
            bettingEnabled: match.betting_enabled,
            minBet: match.min_bet_amount,
            maxBet: match.max_bet_amount,
            commissionRate: match.commission_rate
          };
        });
        setMatchSettings(settings);
      }
    } catch (error: any) {
      console.error('Failed to load match settings:', error);
    }
  };
  
  // Toggle match betting
  const toggleMatchBetting = async (match: any) => {
    const matchId = match.id || match.match_id;
    const currentSettings = matchSettings[matchId];
    const newEnabled = !currentSettings?.bettingEnabled;
    
    try {
      const { data, error } = await supabase.rpc('toggle_match_betting', {
        p_match_id: matchId,
        p_sport_type: selectedSport,
        p_enabled: newEnabled,
        p_match_data: match
      });
      
      if (error) throw error;
      
      // Update local state
      setMatchSettings(prev => ({
        ...prev,
        [matchId]: {
          matchId,
          sportType: selectedSport,
          bettingEnabled: newEnabled,
          minBet: bettingConfig.minBet,
          maxBet: bettingConfig.maxBet,
          commissionRate: bettingConfig.commissionRate
        }
      }));
      
      toast({
        title: "Betting Status Updated",
        description: `Betting ${newEnabled ? 'enabled' : 'disabled'} for ${match.teams?.home} vs ${match.teams?.away}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update match betting status",
        variant: "destructive"
      });
    }
  };
  
  // Open match management dialog
  const openManageMatch = (match: any) => {
    const matchId = match.id || match.match_id;
    const currentSettings = matchSettings[matchId];
    
    setSelectedMatch(match);
    setBettingConfig({
      bettingEnabled: currentSettings?.bettingEnabled || false,
      minBet: currentSettings?.minBet || 10,
      maxBet: currentSettings?.maxBet || 10000,
      commissionRate: currentSettings?.commissionRate || 0.05
    });
    setIsManageMatchOpen(true);
  };
  
  // Save match settings
  const saveMatchSettings = async () => {
    if (!selectedMatch) return;
    
    const matchId = selectedMatch.id || selectedMatch.match_id;
    
    try {
      const { data, error } = await supabase.rpc('toggle_match_betting', {
        p_match_id: matchId,
        p_sport_type: selectedSport,
        p_enabled: bettingConfig.bettingEnabled,
        p_match_data: {
          ...selectedMatch,
          min_bet_amount: bettingConfig.minBet,
          max_bet_amount: bettingConfig.maxBet,
          commission_rate: bettingConfig.commissionRate
        }
      });
      
      if (error) throw error;
      
      // Update local state
      setMatchSettings(prev => ({
        ...prev,
        [matchId]: {
          matchId,
          sportType: selectedSport,
          ...bettingConfig
        }
      }));
      
      setIsManageMatchOpen(false);
      
      toast({
        title: "Settings Saved",
        description: `Match settings updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save match settings",
        variant: "destructive"
      });
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSportsData(selectedSport, 'live'),
        fetchSportsData(selectedSport, 'upcoming'), 
        fetchSportsData(selectedSport, 'results')
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Add new provider
  const addProvider = async () => {
    if (!providerSettings.name || !providerSettings.sport) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newProvider = {
      id: Date.now(),
      name: providerSettings.name,
      sport: providerSettings.sport,
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 99.0,
      cost: 'Custom',
      endpoint: providerSettings.endpoint
    };

    setSportsProviders(prev => [...prev, newProvider]);
    setProviderSettings({ name: '', sport: '', endpoint: '', apiKey: '', autoSync: false });
    setIsAddProviderDialogOpen(false);

    toast({
      title: "Provider Added",
      description: `${providerSettings.name} has been added successfully`,
    });
  };

  // Remove provider
  const removeProvider = (id: number) => {
    setSportsProviders(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Provider Removed",
      description: "Sports data provider has been removed",
    });
  };

  // Auto-fetch data on sport change
  useEffect(() => {
    if (selectedSport) {
      fetchSportsData(selectedSport, 'live');
      fetchSportsData(selectedSport, 'upcoming');
      fetchSportsData(selectedSport, 'results');
    }
  }, [selectedSport]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-gaming-success text-gaming-success-foreground">Connected</Badge>;
      case 'disconnected': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Disconnected</Badge>;
      case 'maintenance': return <Badge className="bg-orange-500 text-white">Maintenance</Badge>;
      case 'live': return <Badge className="bg-gaming-success text-gaming-success-foreground">Live</Badge>;
      case 'upcoming': return <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>;
      case 'ended': return <Badge className="bg-muted text-muted-foreground">Ended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4 text-gaming-success" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-gaming-danger" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-orange-500" />;
      default: return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Render match item
  const renderMatchItem = (match: any, index: number) => {
    const matchId = match.id || match.match_id;
    const settings = matchSettings[matchId];
    const isBettingEnabled = settings?.bettingEnabled || false;
    
    return (
      <div key={`${matchId || index}`} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gaming-gold/10 rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-gaming-gold" />
          </div>
          
          <div>
            <h4 className="font-semibold">{match.teams?.home || 'Team A'} vs {match.teams?.away || 'Team B'}</h4>
            <p className="text-sm text-muted-foreground">{match.league || 'League'}</p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {match.date ? new Date(match.date).toLocaleString() : 'TBD'}
                </span>
              </div>
              {match.venue && (
                <span className="text-xs text-muted-foreground">• {match.venue}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold">
              {match.scores?.home ?? '-'} - {match.scores?.away ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          
          {getStatusBadge(match.status)}
          
          {/* Betting Status Badge */}
          <div className="flex items-center gap-2">
            {isBettingEnabled ? (
              <Badge className="bg-gaming-success/20 text-gaming-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Betting ON
              </Badge>
            ) : (
              <Badge className="bg-gaming-danger/20 text-gaming-danger">
                <Ban className="h-3 w-3 mr-1" />
                Betting OFF
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={isBettingEnabled ? "destructive" : "default"}
              onClick={() => toggleMatchBetting(match)}
              className="min-w-[100px]"
            >
              {isBettingEnabled ? (
                <>
                  <ToggleLeft className="h-3 w-3 mr-1" />
                  Disable
                </>
              ) : (
                <>
                  <ToggleRight className="h-3 w-3 mr-1" />
                  Enable
                </>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openManageMatch(match)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Sports Integration</h2>
          <p className="text-muted-foreground">Manage sports data providers and live events</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={refreshAllData} 
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
          <Dialog open={isAddProviderDialogOpen} onOpenChange={setIsAddProviderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sports Data Provider</DialogTitle>
                <DialogDescription>
                  Connect a new sports data provider to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input 
                    id="provider-name" 
                    placeholder="Enter provider name" 
                    value={providerSettings.name}
                    onChange={(e) => setProviderSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sport-type">Sport Type</Label>
                  <Select value={providerSettings.sport} onValueChange={(value) => setProviderSettings(prev => ({ ...prev, sport: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="hockey">Hockey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input 
                    id="api-endpoint" 
                    placeholder="https://api.provider.com" 
                    value={providerSettings.endpoint}
                    onChange={(e) => setProviderSettings(prev => ({ ...prev, endpoint: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key" 
                    type="password" 
                    placeholder="Enter API key" 
                    value={providerSettings.apiKey}
                    onChange={(e) => setProviderSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-sync" 
                    checked={providerSettings.autoSync}
                    onCheckedChange={(checked) => setProviderSettings(prev => ({ ...prev, autoSync: checked }))}
                  />
                  <Label htmlFor="auto-sync">Enable auto-sync</Label>
                </div>
                
                <Button 
                  onClick={addProvider}
                  className="w-full bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Connect Provider
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Wifi className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">
              {sportsProviders.filter(p => p.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {sportsProviders.filter(p => p.status === 'connected').length} connected, {sportsProviders.filter(p => p.status !== 'connected').length} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {liveData?.items?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Current sport</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">
              {upcomingData?.items?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled matches</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {resultsData?.items?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Recent results</p>
          </CardContent>
        </Card>
      </div>

      {/* Sport Selection */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sports Data Management
          </CardTitle>
          <CardDescription>Select sport and view live data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Label htmlFor="sport-select">Select Sport:</Label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cricket">Cricket</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="hockey">Hockey</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
              </SelectContent>
            </Select>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live-data">Live Events</TabsTrigger>
              <TabsTrigger value="upcoming-data">Upcoming</TabsTrigger>
              <TabsTrigger value="results-data">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="live-data" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Live Events</h3>
                <Badge variant="outline">{liveData?.items?.length || 0} events</Badge>
              </div>
              {liveData?.items?.length > 0 ? (
                <div className="space-y-3">
                  {liveData.items.map((match: any, index: number) => renderMatchItem(match, index))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No live events found for {selectedSport}. Data will refresh automatically.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="upcoming-data" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upcoming Events</h3>
                <Badge variant="outline">{upcomingData?.items?.length || 0} events</Badge>
              </div>
              {upcomingData?.items?.length > 0 ? (
                <div className="space-y-3">
                  {upcomingData.items.map((match: any, index: number) => renderMatchItem(match, index))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No upcoming events found for {selectedSport}.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="results-data" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Results</h3>
                <Badge variant="outline">{resultsData?.items?.length || 0} results</Badge>
              </div>
              {resultsData?.items?.length > 0 ? (
                <div className="space-y-3">
                  {resultsData.items.map((match: any, index: number) => renderMatchItem(match, index))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No recent results found for {selectedSport}.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sports Providers */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Sports Data Providers
          </CardTitle>
          <CardDescription>Manage API connections and data sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sportsProviders.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getStatusIcon(provider.status)}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground">{provider.sport} • {provider.cost}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {provider.events} events • Last sync: {provider.lastSync}
                      </span>
                      <span className="text-xs text-gaming-success">
                        {provider.reliability}% uptime
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{provider.events}</div>
                    <div className="text-xs text-muted-foreground">Live Events</div>
                  </div>
                  
                  {getStatusBadge(provider.status)}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => fetchSportsData(provider.sport.toLowerCase(), 'live')}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-gaming-danger"
                      onClick={() => removeProvider(provider.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sports Analytics
          </CardTitle>
          <CardDescription>Performance metrics and insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cricket</span>
              <div className="text-right">
                <div className="text-sm font-semibold text-gaming-gold">
                  {sportsProviders.find(p => p.sport === 'Cricket')?.events || 0} events
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Football</span>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary">
                  {sportsProviders.find(p => p.sport === 'Football')?.events || 0} events
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Hockey</span>
              <div className="text-right">
                <div className="text-sm font-semibold text-gaming-success">
                  {sportsProviders.find(p => p.sport === 'Hockey')?.events || 0} events
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Active Events</span>
              <span className="text-lg font-bold text-gaming-gold">
                {sportsProviders.reduce((sum, p) => sum + p.events, 0)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Across all sports</span>
              <span className="text-xs text-gaming-success">Live tracking</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Match Settings Dialog */}
      <Dialog open={isManageMatchOpen} onOpenChange={setIsManageMatchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Betting Settings</DialogTitle>
            <DialogDescription>
              Configure betting parameters for {selectedMatch?.teams?.home} vs {selectedMatch?.teams?.away}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Match Info */}
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{selectedMatch?.teams?.home} vs {selectedMatch?.teams?.away}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMatch?.league}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMatch?.date ? new Date(selectedMatch.date).toLocaleString() : 'TBD'}
                  </p>
                </div>
                {getStatusBadge(selectedMatch?.status)}
              </div>
            </div>
            
            {/* Betting Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="betting-enabled">Enable Betting</Label>
                  <p className="text-xs text-muted-foreground">Allow users to place bets on this match</p>
                </div>
                <Switch 
                  id="betting-enabled"
                  checked={bettingConfig.bettingEnabled}
                  onCheckedChange={(checked) => setBettingConfig(prev => ({ ...prev, bettingEnabled: checked }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-bet">Minimum Bet Amount (₹)</Label>
                  <Input 
                    id="min-bet"
                    type="number"
                    value={bettingConfig.minBet}
                    onChange={(e) => setBettingConfig(prev => ({ ...prev, minBet: Number(e.target.value) }))}
                    disabled={!bettingConfig.bettingEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-bet">Maximum Bet Amount (₹)</Label>
                  <Input 
                    id="max-bet"
                    type="number"
                    value={bettingConfig.maxBet}
                    onChange={(e) => setBettingConfig(prev => ({ ...prev, maxBet: Number(e.target.value) }))}
                    disabled={!bettingConfig.bettingEnabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="commission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bettingConfig.commissionRate * 100}
                    onChange={(e) => setBettingConfig(prev => ({ ...prev, commissionRate: Number(e.target.value) / 100 }))}
                    disabled={!bettingConfig.bettingEnabled}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">Platform commission on winning bets</p>
              </div>
              
              {/* Betting Status Summary */}
              {bettingConfig.bettingEnabled && (
                <Alert className="bg-gaming-success/10 border-gaming-success/20">
                  <CheckCircle className="h-4 w-4 text-gaming-success" />
                  <AlertDescription>
                    Betting is enabled with ₹{bettingConfig.minBet} - ₹{bettingConfig.maxBet} limits and {(bettingConfig.commissionRate * 100).toFixed(2)}% commission
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageMatchOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveMatchSettings}
              className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};