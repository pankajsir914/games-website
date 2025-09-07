import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, RefreshCw, Plus, Trash2, Settings, AlertCircle, 
  CheckCircle, Globe, Clock, Activity, Database, Terminal,
  Play, Send, Copy, X, ChevronRight, Zap, Shield, Wifi
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useDiamondAdminAPI } from '@/hooks/useDiamondAdminAPI';
import { supabase } from '@/integrations/supabase/client';

export const LiveSportsIntegration = () => {
  const { toast } = useToast();
  const diamondAPI = useDiamondSportsAPI();
  const adminAPI = useDiamondAdminAPI();
  
  const [activeTab, setActiveTab] = useState('sids');
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [selectedSID, setSelectedSID] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [sidConfigs, setSidConfigs] = useState<any[]>([]);
  const [sportsData, setSportsData] = useState<any>(null);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [oddsData, setOddsData] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  
  // Dialog states
  const [isSIDDialogOpen, setIsSIDDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isEndpointDialogOpen, setIsEndpointDialogOpen] = useState(false);
  
  // Form states
  const [sidForm, setSidForm] = useState({
    sport_type: 'cricket',
    sid: '',
    is_active: true,
    auto_sync: false,
    sync_interval: 60
  });
  
  const [endpointForm, setEndpointForm] = useState({
    path: 'sports/allSportid',
    method: 'GET',
    params: ''
  });
  
  const [resultForm, setResultForm] = useState({
    market_id: '',
    selection_id: '',
    result: 'win'
  });

  // Load initial data
  useEffect(() => {
    loadSIDConfigs();
    loadAPILogs();
  }, []);

  // Load SID configurations
  const loadSIDConfigs = async () => {
    const configs = await adminAPI.getSIDConfigs();
    setSidConfigs(configs);
  };

  // Load API logs
  const loadAPILogs = async () => {
    const logs = await adminAPI.getAPILogs(20);
    setApiLogs(logs);
  };

  // Fetch all sports IDs
  const fetchAllSportsIDs = async () => {
    setLoading(true);
    try {
      const response = await diamondAPI.getAllSportsId();
      if (response?.success) {
        setSportsData(response.data);
        toast({
          title: "Sports IDs Fetched",
          description: `Found ${response.data?.length || 0} sports`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sports IDs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches for selected SID
  const fetchMatches = async () => {
    if (!selectedSID) {
      toast({
        title: "Error",
        description: "Please select a SID first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await diamondAPI.getAllMatch(selectedSID);
      if (response?.success) {
        setMatchesData(response.data || []);
        toast({
          title: "Matches Fetched",
          description: `Found ${response.data?.length || 0} matches for SID ${selectedSID}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch odds for match
  const fetchMatchOdds = async (eventId: string) => {
    setLoading(true);
    try {
      const response = await diamondAPI.getOdds(eventId);
      if (response?.success) {
        setOddsData(response.data);
        toast({
          title: "Odds Fetched",
          description: `Fetched odds for event ${eventId}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch odds",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save SID configuration
  const saveSIDConfig = async () => {
    const result = await adminAPI.manageSID(sidForm);
    if (result) {
      await loadSIDConfigs();
      setIsSIDDialogOpen(false);
      setSidForm({
        sport_type: 'cricket',
        sid: '',
        is_active: true,
        auto_sync: false,
        sync_interval: 60
      });
    }
  };

  // Delete SID configuration
  const deleteSIDConfig = async (id: string) => {
    const success = await adminAPI.deleteSID(id);
    if (success) {
      await loadSIDConfigs();
    }
  };

  // Toggle match betting
  const toggleMatchBetting = async (match: any) => {
    try {
      const { data, error } = await supabase.rpc('toggle_match_betting', {
        p_match_id: match.eventId || match.id,
        p_sport_type: selectedSport,
        p_enabled: !match.bettingEnabled,
        p_match_data: {
          ...match,
          diamond_event_id: match.eventId,
          diamond_data: match
        }
      });

      if (error) throw error;

      toast({
        title: "Betting Status Updated",
        description: `Betting ${!match.bettingEnabled ? 'enabled' : 'disabled'} for match`
      });

      // Refresh matches
      await fetchMatches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update betting status",
        variant: "destructive"
      });
    }
  };

  // Post match result
  const postMatchResult = async () => {
    if (!selectedMatch) return;

    const result = await adminAPI.postMatchResult({
      match_id: selectedMatch.eventId,
      event_id: selectedMatch.eventId,
      market_id: resultForm.market_id,
      selection_id: resultForm.selection_id,
      sport_type: selectedSport,
      result_status: resultForm.result as any,
      result_data: { match: selectedMatch }
    });

    if (result) {
      setIsResultDialogOpen(false);
      setResultForm({
        market_id: '',
        selection_id: '',
        result: 'win'
      });
    }
  };

  // Test API endpoint
  const testEndpoint = async () => {
    let params = {};
    try {
      if (endpointForm.params) {
        params = JSON.parse(endpointForm.params);
      }
    } catch {
      toast({
        title: "Error",
        description: "Invalid JSON parameters",
        variant: "destructive"
      });
      return;
    }

    const response = await adminAPI.testEndpoint(
      endpointForm.path,
      endpointForm.method,
      params
    );

    if (response) {
      await loadAPILogs();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; icon: any; label: string }> = {
      'L': { variant: 'default', icon: Activity, label: 'Live' },
      '1': { variant: 'outline', icon: Clock, label: 'Upcoming' },
      '3': { variant: 'secondary', icon: CheckCircle, label: 'Completed' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', icon: Globe, label: status };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Diamond Sports Integration</h2>
          <p className="text-muted-foreground">Manage Diamond Sports API integration and match betting</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-2">
            <Wifi className="h-4 w-4 mr-2 text-gaming-success" />
            Diamond API Connected
          </Badge>
          <Button onClick={loadAPILogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="sids">Sports & SIDs</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="odds">Odds & Markets</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="endpoint">Endpoint Explorer</TabsTrigger>
        </TabsList>

        {/* Sports & SIDs Tab */}
        <TabsContent value="sids" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sports & SID Management</CardTitle>
                  <CardDescription>Configure sports and their SIDs for Diamond API</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchAllSportsIDs} variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    Fetch All Sports
                  </Button>
                  <Button onClick={() => setIsSIDDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add SID
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sports Data Display */}
              {sportsData && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Available Sports: {JSON.stringify(sportsData).slice(0, 200)}...
                  </AlertDescription>
                </Alert>
              )}

              {/* SID Configurations List */}
              <div className="space-y-3">
                {sidConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.sport_type}
                      </Badge>
                      <div>
                        <p className="font-medium">SID: {config.sid || 'Default'}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.auto_sync ? `Auto-sync every ${config.sync_interval}s` : 'Manual sync'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.is_active && (
                        <Badge variant="outline" className="text-gaming-success">
                          <Activity className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSID(config.sid);
                          setSelectedSport(config.sport_type);
                          toast({
                            title: "SID Selected",
                            description: `Selected ${config.sport_type} - ${config.sid}`
                          });
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSIDConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Match Management</CardTitle>
                  <CardDescription>View and manage matches from Diamond API</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedSID} onValueChange={setSelectedSID}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select SID" />
                    </SelectTrigger>
                    <SelectContent>
                      {sidConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.sid || 'default'}>
                          {config.sport_type} - {config.sid || 'Default'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchMatches} disabled={!selectedSID || loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Fetch Matches
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {matchesData.map((match, index) => (
                    <div key={match.eventId || index} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{match.eventName || 'Match'}</p>
                          {getStatusBadge(match.eventStatus || match.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Event ID: {match.eventId} | Start: {match.eventDate}
                        </p>
                        {match.marketCount && (
                          <Badge variant="outline" className="mt-2">
                            {match.marketCount} Markets
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={match.bettingEnabled ? 'destructive' : 'default'}
                          onClick={() => toggleMatchBetting(match)}
                        >
                          {match.bettingEnabled ? 'Disable' : 'Enable'} Betting
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMatch(match);
                            fetchMatchOdds(match.eventId);
                            setIsMatchDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Odds & Markets Tab */}
        <TabsContent value="odds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Odds & Markets</CardTitle>
              <CardDescription>View and manage betting odds and markets</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMatch && oddsData ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Match: {selectedMatch.eventName} | Markets: {oddsData?.markets?.length || 0}
                    </AlertDescription>
                  </Alert>
                  <ScrollArea className="h-[400px]">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(oddsData, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a match to view odds and markets
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Match Results Management</CardTitle>
                  <CardDescription>Post and manage match results</CardDescription>
                </div>
                <Button 
                  onClick={() => setIsResultDialogOpen(true)}
                  disabled={!selectedMatch}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Result
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedMatch ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selected Match: {selectedMatch.eventName} (ID: {selectedMatch.eventId})
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-muted-foreground">
                    Use the "Post Result" button to update match results in the system.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a match from the Matches tab to post results
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoint Explorer Tab */}
        <TabsContent value="endpoint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Explorer</CardTitle>
              <CardDescription>Test Diamond Sports API endpoints directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Method</Label>
                  <Select
                    value={endpointForm.method}
                    onValueChange={(value) => setEndpointForm({ ...endpointForm, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Endpoint Path</Label>
                  <Input
                    value={endpointForm.path}
                    onChange={(e) => setEndpointForm({ ...endpointForm, path: e.target.value })}
                    placeholder="sports/allSportid"
                  />
                </div>
              </div>
              
              <div>
                <Label>Parameters (JSON)</Label>
                <Textarea
                  value={endpointForm.params}
                  onChange={(e) => setEndpointForm({ ...endpointForm, params: e.target.value })}
                  placeholder='{"eventId": "123"}'
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={testEndpoint} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Test Endpoint
                </Button>
              </div>

              {/* API Logs */}
              <div>
                <h4 className="font-medium mb-3">Recent API Tests</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {apiLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-background/50 rounded-lg border text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={log.status_code === 200 ? 'default' : 'destructive'}>
                            {log.method} {log.status_code}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {log.response_time_ms}ms
                          </span>
                        </div>
                        <p className="font-mono text-xs truncate">{log.endpoint}</p>
                        {log.params && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Params: {JSON.stringify(log.params).slice(0, 50)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SID Configuration Dialog */}
      <Dialog open={isSIDDialogOpen} onOpenChange={setIsSIDDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Sports SID</DialogTitle>
            <DialogDescription>Add or update SID configuration for a sport</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sport Type</Label>
              <Select
                value={sidForm.sport_type}
                onValueChange={(value) => setSidForm({ ...sidForm, sport_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cricket">Cricket</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SID</Label>
              <Input
                value={sidForm.sid}
                onChange={(e) => setSidForm({ ...sidForm, sid: e.target.value })}
                placeholder="Enter SID (leave empty for default)"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={sidForm.is_active}
                onCheckedChange={(checked) => setSidForm({ ...sidForm, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Sync</Label>
              <Switch
                checked={sidForm.auto_sync}
                onCheckedChange={(checked) => setSidForm({ ...sidForm, auto_sync: checked })}
              />
            </div>
            {sidForm.auto_sync && (
              <div>
                <Label>Sync Interval (seconds)</Label>
                <Input
                  type="number"
                  value={sidForm.sync_interval}
                  onChange={(e) => setSidForm({ ...sidForm, sync_interval: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSIDDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSIDConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Posting Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Match Result</DialogTitle>
            <DialogDescription>Update the result for the selected match</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Market ID</Label>
              <Input
                value={resultForm.market_id}
                onChange={(e) => setResultForm({ ...resultForm, market_id: e.target.value })}
                placeholder="Enter market ID"
              />
            </div>
            <div>
              <Label>Selection ID</Label>
              <Input
                value={resultForm.selection_id}
                onChange={(e) => setResultForm({ ...resultForm, selection_id: e.target.value })}
                placeholder="Enter selection ID"
              />
            </div>
            <div>
              <Label>Result</Label>
              <Select
                value={resultForm.result}
                onValueChange={(value) => setResultForm({ ...resultForm, result: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={postMatchResult}>
              Post Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};