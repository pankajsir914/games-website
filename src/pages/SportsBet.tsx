import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Tv, FileText, Target, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import LiveTVSection from '@/components/sports/LiveTVSection';
import EnhancedOddsDisplay from '@/components/sports/EnhancedOddsDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SportsBet: React.FC = () => {
  const { sport, matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { getPriveteData, callAPI } = useDiamondSportsAPI();
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [match, setMatch] = useState<any>(state?.match || null);
  const [odds, setOdds] = useState<any>(null);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [liveTvUrl, setLiveTvUrl] = useState<string | null>(null);
  const [isLoadingTv, setIsLoadingTv] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiDebugInfo, setApiDebugInfo] = useState<any>(null);

  const [liveScore, setLiveScore] = useState<any>(null);
  const [liveDetails, setLiveDetails] = useState<any>(null);

  // Helper: Get SID from sport type
  const getSportSID = (sportType: string): string => {
    const sidMap: Record<string, string> = {
      'Cricket': '4',
      'Football': '1', 
      'Tennis': '2',
      'Soccer': '1'
    };
    return sidMap[sportType] || '4'; // Default to cricket
  };

  // Fetch live TV URL
  useEffect(() => {
    const fetchLiveTv = async () => {
      if (!matchId || matchId === 'undefined') return;
      
      setIsLoadingTv(true);
      try {
        // Try to get live TV URL
        const response = await callAPI('sports/livetv', { 
          params: { eventId: matchId } 
        });
        
        if (response?.success && response.data) {
          const iframeUrl = response.data.iframeUrl || 
                           response.data.url || 
                           response.data.liveUrl ||
                           response.data.hlsUrl ||
                           response.data.streamUrl ||
                           response.data.tv_url ||
                           response.data.m3u8;
          
          if (iframeUrl) {
            setLiveTvUrl(iframeUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching live TV:', error);
      } finally {
        setIsLoadingTv(false);
      }
    };

    fetchLiveTv();
    
    // Refresh TV URL every 30 seconds for live matches
    if (match?.status === 'Live') {
      const interval = setInterval(fetchLiveTv, 30000);
      return () => clearInterval(interval);
    }
  }, [matchId, match?.status, callAPI]);

  // Fetch live match details and score
  useEffect(() => {
    const fetchLiveMatchData = async () => {
      if (!matchId || matchId === 'undefined') return;

      try {
        // Fetch match details, score and other live data
        const [scoreResponse, detailsResponse, matchResponse] = await Promise.all([
          callAPI(`sports/sportsScore`, { params: { eventId: matchId } }),
          callAPI(`sports/allGameDetails`, { params: { eventId: matchId } }),
          callAPI(`sports/esid`, { sid: '4' }) // Cricket SID
        ]);

        if (scoreResponse?.success) {
          setLiveScore(scoreResponse.data);
          console.log('Live score:', scoreResponse.data);
        }

        if (detailsResponse?.success) {
          setLiveDetails(detailsResponse.data);
          console.log('Live details:', detailsResponse.data);
        }

        // Update match info if available
        if (matchResponse?.success && matchResponse.data?.t1) {
          const liveMatch = matchResponse.data.t1.find((m: any) => 
            m.eid === matchId || m.gmid === matchId
          );
          if (liveMatch) {
            setMatch(prev => ({
              ...prev,
              team1: liveMatch.t1 || prev?.team1,
              team2: liveMatch.t2 || prev?.team2,
              status: liveMatch.status === '1' ? 'Live' : prev?.status,
              score: liveMatch.score || prev?.score
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching live match data:', error);
      }
    };

    // Initial fetch
    fetchLiveMatchData();

    // Set up interval for live updates (every 5 seconds for live matches)
    const interval = setInterval(() => {
      if (match?.status === 'Live') {
        fetchLiveMatchData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId, match?.status, callAPI]);

  // Fetch odds from Diamond API with live updates
  useEffect(() => {
    const fetchOdds = async () => {
      if (!matchId || matchId === 'undefined') {
        const errorMsg = 'Invalid match ID. Please select a valid match.';
        setOddsError(errorMsg);
        setApiDebugInfo({ error: errorMsg, matchId, sport });
        return;
      }
      
      setIsLoadingOdds(true);
      setOddsError(null);
      
      try {
        const sid = getSportSID(sport || 'Cricket');
        console.log(`Fetching odds: SID=${sid}, GMID=${matchId}, Sport=${sport}`);
        
        // Primary: Use the dedicated getPriveteData function
        const response = await getPriveteData(sid, matchId);
        
        // Store debug info
        setApiDebugInfo({
          endpoint: 'sports/getPriveteData',
          sid,
          gmid: matchId,
          sport,
          success: response?.success,
          errorCode: response?.errorCode,
          error: response?.error,
          dataReceived: !!response?.data,
          timestamp: new Date().toISOString()
        });
        
        console.log('Diamond API response:', response);
        
        if (response?.success && response.data) {
          setOdds(response.data);
          setOddsError(null);
        } else {
          // Handle specific error cases
          const errorMsg = response?.error || 'Odds not available for this match';
          setOddsError(errorMsg);
          
          // Show user-friendly toast based on error type
          if (response?.errorCode === 404) {
            toast({
              title: "Odds Not Available",
              description: "This match doesn't have live odds yet. Check back when the match starts.",
            });
          } else if (response?.errorCode === 429) {
            toast({
              title: "Too Many Requests",
              description: "Please wait a moment before refreshing odds.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Loading Odds",
              description: "Connecting to live odds feed...",
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch odds:', error);
        const errorMsg = error?.message || 'Failed to load odds';
        setOddsError(errorMsg);
        setApiDebugInfo({
          error: errorMsg,
          matchId,
          sport,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Connection Error",
          description: "Unable to fetch odds. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingOdds(false);
      }
    };

    fetchOdds();
    
    // Refresh odds every 10 seconds for live matches
    const oddsInterval = setInterval(() => {
      if (match?.status === 'Live') {
        fetchOdds();
      }
    }, 10000);

    return () => clearInterval(oddsInterval);
  }, [matchId, match?.status, sport, getPriveteData, toast]);

  const handleSelectBet = (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string) => {
    setSelectedBet({
      selection,
      type,
      rate,
      marketType,
      matchId,
      matchName: `${match?.team1} vs ${match?.team2}`,
      sport
    });
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (wallet && amount > (wallet as any).balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this bet",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingBet(true);
    try {
      // Here you would normally call your bet placement API
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Bet placed successfully!",
        description: `Your ${selectedBet.type} bet of ₹${amount} has been placed`,
      });
      
      // Reset bet slip
      setSelectedBet(null);
      setBetAmount('');
    } catch (error) {
      toast({
        title: "Failed to place bet",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const calculatePotentialWin = () => {
    if (!betAmount || !selectedBet) return 0;
    const amount = parseFloat(betAmount);
    if (selectedBet.type === 'back') {
      return amount * selectedBet.rate;
    } else {
      // For lay bets, you win the stake amount
      return amount;
    }
  };

  const calculateLiability = () => {
    if (!betAmount || !selectedBet) return 0;
    const amount = parseFloat(betAmount);
    if (selectedBet.type === 'lay') {
      return amount * (selectedBet.rate - 1);
    }
    return amount;
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Match not found</p>
              <Button 
                onClick={() => navigate('/sports')}
                className="mt-4"
              >
                Back to Sports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/sports')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sports
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {match.team1} vs {match.team2}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={match.status === 'Live' ? 'destructive' : 'secondary'} className={match.status === 'Live' ? 'animate-pulse' : ''}>
                      {match.status || 'Upcoming'}
                    </Badge>
                    <Badge variant="outline">{sport}</Badge>
                    {match.league && <Badge variant="outline">{match.league}</Badge>}
                    {match.status === 'Live' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/30">
                        🔴 LIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {liveScore ? (
                    <>
                      <p className="text-3xl font-bold">
                        {liveScore.runs}/{liveScore.wickets}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Overs: {liveScore.overs} | RR: {liveScore.runRate}
                      </p>
                    </>
                  ) : match.score ? (
                    <>
                      <p className="text-3xl font-bold">{match.score}</p>
                      <p className="text-sm text-muted-foreground mt-1">Current Score</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Score will appear here</p>
                  )}
                </div>
              </div>
              {liveDetails && (
                <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{liveDetails.fours || '0'}</p>
                    <p className="text-xs text-muted-foreground">Fours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{liveDetails.sixes || '0'}</p>
                    <p className="text-xs text-muted-foreground">Sixes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{liveDetails.extras || '0'}</p>
                    <p className="text-xs text-muted-foreground">Extras</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{liveDetails.runRate || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Run Rate</p>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="odds" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="odds" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">ODDS</span>
            </TabsTrigger>
            <TabsTrigger value="matchbet" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Match Bet</span>
            </TabsTrigger>
            <TabsTrigger value="livetv" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              <span className="hidden sm:inline">Live TV</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Match Details</span>
            </TabsTrigger>
          </TabsList>

          {/* ODDS Tab */}
          <TabsContent value="odds" className="space-y-6">
            {/* Error Alert with Refresh */}
            {oddsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{oddsError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="ml-4"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Debug Panel (Dev Mode) */}
            {apiDebugInfo && (
              <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <CardHeader className="cursor-pointer" onClick={() => setShowDebug(!showDebug)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      API Diagnostic Info
                    </CardTitle>
                    {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {showDebug && (
                  <CardContent className="text-xs font-mono space-y-1">
                    <div><strong>Match ID (gmid):</strong> {apiDebugInfo.gmid || matchId}</div>
                    <div><strong>Sport ID (sid):</strong> {apiDebugInfo.sid || getSportSID(sport || 'Cricket')}</div>
                    <div><strong>Sport Type:</strong> {apiDebugInfo.sport || sport}</div>
                    <div><strong>Endpoint:</strong> {apiDebugInfo.endpoint || 'sports/getPriveteData'}</div>
                    <div><strong>Success:</strong> {apiDebugInfo.success ? '✅ Yes' : '❌ No'}</div>
                    {apiDebugInfo.errorCode && <div><strong>Error Code:</strong> {apiDebugInfo.errorCode}</div>}
                    {apiDebugInfo.error && <div><strong>Error:</strong> {apiDebugInfo.error}</div>}
                    <div><strong>Data Received:</strong> {apiDebugInfo.dataReceived ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Timestamp:</strong> {apiDebugInfo.timestamp || new Date().toISOString()}</div>
                  </CardContent>
                )}
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EnhancedOddsDisplay 
                  odds={odds}
                  selectedBet={selectedBet}
                  onSelectBet={(selection, type, rate, marketType) => {
                    setSelectedBet({
                      selection,
                      type,
                      rate,
                      marketType,
                      matchId,
                      matchName: `${match?.team1} vs ${match?.team2}`,
                      sport
                    });
                  }}
                  isLoading={isLoadingOdds}
                />
              </div>

              {/* Bet Slip */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Bet Slip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBet ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-semibold">{selectedBet.matchName}</p>
                          <p className="text-sm text-muted-foreground">{selectedBet.selection}</p>
                          <div className="flex justify-between mt-2">
                            <Badge variant={selectedBet.type === 'back' ? 'default' : 'destructive'}>
                              {selectedBet.type.toUpperCase()}
                            </Badge>
                            <span className="font-bold">{selectedBet.rate}</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="bet-amount">Stake Amount (₹)</Label>
                          <Input
                            id="bet-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="space-y-2 p-3 bg-muted rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Potential Win:</span>
                            <span className="font-semibold text-primary">
                              ₹{calculatePotentialWin().toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Liability:</span>
                            <span className="font-semibold text-destructive">
                              ₹{calculateLiability().toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            onClick={handlePlaceBet}
                            disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
                          >
                            {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedBet(null);
                              setBetAmount('');
                            }}
                          >
                            Clear Bet Slip
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Select a bet to get started
                      </p>
                    )}
                    
                    {/* Wallet Balance */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Wallet Balance:</span>
                        <span className="font-semibold">₹{wallet ? ((wallet as any).balance || 0).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Match Bet Tab */}
          <TabsContent value="matchbet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Place Your Bet</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBet ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-semibold text-lg">{selectedBet.matchName}</p>
                      <p className="text-muted-foreground">{selectedBet.selection}</p>
                      <div className="flex justify-between mt-3">
                        <Badge variant={selectedBet.type === 'back' ? 'default' : 'destructive'} className="text-base">
                          {selectedBet.type.toUpperCase()}
                        </Badge>
                        <span className="font-bold text-xl">{selectedBet.rate}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bet-amount-main">Stake Amount (₹)</Label>
                      <Input
                        id="bet-amount-main"
                        type="number"
                        placeholder="Enter amount"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="mt-2 text-lg p-6"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Potential Win</p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{calculatePotentialWin().toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Liability</p>
                        <p className="text-2xl font-bold text-destructive">
                          ₹{calculateLiability().toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        className="w-full text-lg py-6"
                        onClick={handlePlaceBet}
                        disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
                      >
                        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedBet(null);
                          setBetAmount('');
                        }}
                      >
                        Clear Bet Slip
                      </Button>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Wallet Balance:</span>
                        <span className="font-bold text-xl">₹{wallet ? ((wallet as any).balance || 0).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg mb-4">No bet selected</p>
                    <p className="text-sm text-muted-foreground">Go to ODDS tab to select a bet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live TV Tab */}
          <TabsContent value="livetv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  Live Match Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTv ? (
                  <div className="bg-muted rounded-lg p-12 text-center">
                    <div className="animate-pulse">
                      <Tv className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading live stream...</p>
                    </div>
                  </div>
                ) : liveTvUrl ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={liveTvUrl}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allowFullScreen
                      frameBorder="0"
                      title="Live Match Stream"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg p-12 text-center">
                    <Tv className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Live stream not available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {match?.status === 'Live' ? 'Stream will start soon' : 'Check back when the match starts'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Home Team</p>
                    <p className="text-2xl font-bold">{match.team1}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Away Team</p>
                    <p className="text-2xl font-bold">{match.team2}</p>
                  </div>
                </div>

                {match.venue && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Venue</p>
                    <p className="font-semibold">{match.venue}</p>
                  </div>
                )}

                {match.date && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Date & Time</p>
                    <p className="font-semibold">{new Date(match.date).toLocaleString()}</p>
                  </div>
                )}

                {liveDetails && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Live Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.fours || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Fours</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.sixes || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Sixes</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.extras || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Extras</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.runRate || '0.0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Run Rate</p>
                      </div>
                    </div>
                  </div>
                )}

                {!liveDetails && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Live statistics will appear when the match starts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SportsBet;