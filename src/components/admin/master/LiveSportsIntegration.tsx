import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
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
  Globe
} from 'lucide-react';

export const LiveSportsIntegration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('live-data');
  const [liveData, setLiveData] = useState<any>(null);
  const [upcomingData, setUpcomingData] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [selectedSport, setSelectedSport] = useState('cricket');
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
      id: 2,
      name: 'CricAPI (Cricket)',
      sport: 'Cricket', 
      status: 'connected',
      events: 0,
      lastSync: 'Never',
      reliability: 98.8,
      cost: 'Free Tier',
      endpoint: 'https://api.cricapi.com/v1'
    },
    {
      id: 3,
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
  const renderMatchItem = (match: any, index: number) => (
    <div key={`${match.id || index}`} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gaming-gold/10 rounded-lg flex items-center justify-center">
          <Trophy className="h-5 w-5 text-gaming-gold" />
        </div>
        
        <div>
          <h4 className="font-semibold">{match.teams?.home} vs {match.teams?.away}</h4>
          <p className="text-sm text-muted-foreground">{match.league}</p>
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
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            Manage
          </Button>
        </div>
      </div>
    </div>
  );

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
    </div>
  );
};