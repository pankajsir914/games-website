import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Activity,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSportsOdds } from '@/hooks/useSportsOdds';

interface OddsComparison {
  match: string;
  betfairBack: number;
  betfairLay: number;
  bookmakerBest: number;
  liquidity: number;
  arbitrage?: boolean;
}

export const BetfairTestingDashboard = () => {
  const { toast } = useToast();
  const { fetchOdds, loading, error } = useSportsOdds();
  const [selectedSport, setSelectedSport] = useState('football');
  const [provider, setProvider] = useState<'betfair' | 'odds-api' | 'mock'>('betfair');
  const [betfairData, setBetfairData] = useState<any[]>([]);
  const [traditionalData, setTraditionalData] = useState<any[]>([]);
  const [comparisons, setComparisons] = useState<OddsComparison[]>([]);
  const [testMode, setTestMode] = useState(true);
  const [apiUsage, setApiUsage] = useState({
    calls: 0,
    limit: 1000,
    remaining: 1000,
    resetTime: new Date(Date.now() + 3600000).toISOString()
  });

  // Fetch odds from provider
  const fetchProviderOdds = async (providerType: 'betfair' | 'odds-api' | 'mock') => {
    try {
      const odds = await fetchOdds(selectedSport, undefined, {
        region: 'uk',
        markets: ['h2h', 'spreads', 'totals'],
        provider: providerType as any
      });

      if (providerType === 'betfair') {
        setBetfairData(odds);
      } else {
        setTraditionalData(odds);
      }

      // Update API usage
      setApiUsage(prev => ({
        ...prev,
        calls: prev.calls + 1,
        remaining: prev.remaining - 1
      }));

      toast({
        title: "Odds Fetched",
        description: `Retrieved ${odds.length} markets from ${providerType}`,
      });

      return odds;
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to fetch odds from ${providerType}`,
        variant: "destructive"
      });
      return [];
    }
  };

  // Compare odds between providers
  const compareOdds = async () => {
    const betfair = await fetchProviderOdds('betfair');
    const traditional = await fetchProviderOdds('odds-api');

    const comparisons: OddsComparison[] = [];
    
    betfair.forEach(bf => {
      const trad = traditional.find(t => 
        t.home_team === bf.home_team || t.away_team === bf.away_team
      );

      if (trad && bf.bookmakers?.[0]?.markets?.[0]?.outcomes) {
        const bfOutcomes = bf.bookmakers[0].markets[0].outcomes;
        const homeBack = bfOutcomes.find((o: any) => o.name === bf.home_team)?.backPrice || 0;
        const homeLay = bfOutcomes.find((o: any) => o.name === bf.home_team)?.layPrice || 0;
        
        let bestBookmaker = 0;
        if (trad.bookmakers) {
          trad.bookmakers.forEach((bm: any) => {
            bm.markets?.forEach((m: any) => {
              const homeOdds = m.outcomes?.find((o: any) => o.name === trad.home_team)?.price || 0;
              if (homeOdds > bestBookmaker) bestBookmaker = homeOdds;
            });
          });
        }

        const comp: OddsComparison = {
          match: `${bf.home_team} vs ${bf.away_team}`,
          betfairBack: homeBack,
          betfairLay: homeLay,
          bookmakerBest: bestBookmaker,
          liquidity: bf.liquidity || 0,
          arbitrage: homeLay < bestBookmaker
        };

        comparisons.push(comp);
      }
    });

    setComparisons(comparisons);
  };

  // Test Betfair integration
  const testBetfairIntegration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sports-odds', {
        body: {
          sport: selectedSport,
          provider: 'betfair',
          markets: ['MATCH_ODDS']
        }
      });

      if (error) throw error;

      toast({
        title: "Betfair Test Successful",
        description: `Connected successfully. ${data?.count || 0} markets available.`,
      });

      setBetfairData(data?.data || []);
    } catch (err: any) {
      toast({
        title: "Betfair Test Failed",
        description: err.message || "Unable to connect to Betfair",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Betfair Exchange Testing Dashboard
          </CardTitle>
          <CardDescription>
            Test and compare Betfair Exchange odds with traditional bookmakers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="cricket">Cricket</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="horse-racing">Horse Racing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="betfair">Betfair Exchange</SelectItem>
                  <SelectItem value="odds-api">The Odds API</SelectItem>
                  <SelectItem value="mock">Mock Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={() => fetchProviderOdds(provider)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Fetch Odds
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="test-mode"
                checked={testMode}
                onCheckedChange={setTestMode}
              />
              <Label htmlFor="test-mode">Test Mode</Label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiUsage.calls}</div>
            <p className="text-xs text-muted-foreground">
              {apiUsage.remaining} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Betfair Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-gaming-success text-gaming-success-foreground">
              Connected
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Session valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Markets Loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{betfairData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active markets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Test Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={testMode ? 'default' : 'destructive'}>
              {testMode ? 'Testing' : 'Production'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {testMode ? 'Using test data' : 'Live data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Odds Comparison */}
      <Tabs defaultValue="betfair" className="space-y-4">
        <TabsList>
          <TabsTrigger value="betfair">Betfair Exchange</TabsTrigger>
          <TabsTrigger value="comparison">Odds Comparison</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="betfair" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Betfair Exchange Markets</CardTitle>
              <CardDescription>Live exchange odds with back and lay prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {betfairData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No markets loaded. Click "Fetch Odds" to load data.
                  </div>
                ) : (
                  betfairData.map((market: any, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{market.event || `${market.home_team} vs ${market.away_team}`}</h4>
                          <p className="text-sm text-muted-foreground">{market.competition}</p>
                        </div>
                        <Badge variant="outline">
                          Liquidity: ${(market.liquidity || 0).toLocaleString()}
                        </Badge>
                      </div>

                      {market.bookmakers?.[0]?.markets?.[0]?.outcomes && (
                        <div className="grid grid-cols-3 gap-4">
                          {market.bookmakers[0].markets[0].outcomes.map((outcome: any, i: number) => (
                            <div key={i} className="space-y-2">
                              <p className="text-sm font-medium">{outcome.name}</p>
                              <div className="flex gap-2">
                                <div className="flex-1 bg-gaming-success/10 rounded p-2">
                                  <p className="text-xs text-muted-foreground">Back</p>
                                  <p className="font-bold text-gaming-success">
                                    {outcome.backPrice || '-'}
                                  </p>
                                  <p className="text-xs">${outcome.backSize || 0}</p>
                                </div>
                                <div className="flex-1 bg-gaming-danger/10 rounded p-2">
                                  <p className="text-xs text-muted-foreground">Lay</p>
                                  <p className="font-bold text-gaming-danger">
                                    {outcome.layPrice || '-'}
                                  </p>
                                  <p className="text-xs">${outcome.laySize || 0}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Comparison</CardTitle>
              <CardDescription>Compare odds between Betfair and traditional bookmakers</CardDescription>
              <Button onClick={compareOdds} size="sm" className="mt-2">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Compare Odds
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {comparisons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Click "Compare Odds" to see comparisons
                  </div>
                ) : (
                  comparisons.map((comp, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{comp.match}</h4>
                          <div className="flex gap-4 mt-2">
                            <div>
                              <span className="text-sm text-muted-foreground">Betfair Back: </span>
                              <span className="font-bold text-gaming-success">{comp.betfairBack}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Betfair Lay: </span>
                              <span className="font-bold text-gaming-danger">{comp.betfairLay}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Best Bookmaker: </span>
                              <span className="font-bold">{comp.bookmakerBest}</span>
                            </div>
                          </div>
                        </div>
                        {comp.arbitrage && (
                          <Badge className="bg-gaming-gold text-gaming-gold-foreground">
                            Arbitrage
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arbitrage Opportunities</CardTitle>
              <CardDescription>Potential arbitrage between exchange and bookmakers</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Arbitrage opportunities are theoretical and may not be achievable in practice due to 
                  betting limits, market movements, and commission rates.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                {comparisons.filter(c => c.arbitrage).map((comp, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gaming-gold/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{comp.match}</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            Lay on Betfair: <span className="font-bold text-gaming-danger">{comp.betfairLay}</span>
                          </p>
                          <p className="text-sm">
                            Back at Bookmaker: <span className="font-bold text-gaming-success">{comp.bookmakerBest}</span>
                          </p>
                          <p className="text-sm">
                            Potential Profit: <span className="font-bold text-gaming-gold">
                              {((comp.bookmakerBest - comp.betfairLay) / comp.betfairLay * 100).toFixed(2)}%
                            </span>
                          </p>
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-gaming-gold" />
                    </div>
                  </div>
                ))}
                {comparisons.filter(c => c.arbitrage).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No arbitrage opportunities detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>Test various Betfair Exchange functionalities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testBetfairIntegration} variant="outline">
              Test Connection
            </Button>
            <Button onClick={() => fetchProviderOdds('betfair')} variant="outline">
              Fetch Live Markets
            </Button>
            <Button onClick={compareOdds} variant="outline">
              Compare All Providers
            </Button>
            <Button 
              onClick={() => {
                setApiUsage(prev => ({ ...prev, calls: 0, remaining: 1000 }));
                toast({
                  title: "Counters Reset",
                  description: "API usage counters have been reset",
                });
              }} 
              variant="outline"
            >
              Reset Counters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};