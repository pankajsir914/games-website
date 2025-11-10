import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Tv, FileText, Target, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Info, Trophy, Users, Cloud, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useDiamondSportsData } from '@/hooks/useDiamondSportsData';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import EnhancedLiveTVSection from '@/components/sports/EnhancedLiveTVSection';
import EnhancedOddsDisplay from '@/components/sports/EnhancedOddsDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

const SportsBet: React.FC = () => {
  const { sport, matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { getPriveteData, callAPI, getBetfairScoreTv, getDetailsData } = useDiamondSportsAPI();
  const { connectOddsWebSocket } = useDiamondSportsData();
  const { wallet } = useWallet();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  
  const [match, setMatch] = useState<any>(state?.match || null);
  const [odds, setOdds] = useState<any>(null);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [liveTvUrl, setLiveTvUrl] = useState<string | null>(null);
  const [isLoadingTv, setIsLoadingTv] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [betfairData, setBetfairData] = useState<{
    tv: string | null;
    scorecard: string | null;
    commentary: string | null;
    statistics: string | null;
    highlights: string | null;
    alternateStreams: string[];
  }>({
    tv: null,
    scorecard: null,
    commentary: null,
    statistics: null,
    highlights: null,
    alternateStreams: []
  });

  const [liveScore, setLiveScore] = useState<any>(null);
  const [liveDetails, setLiveDetails] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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

  // Fetch all Betfair Score TV data (TV, Scorecard, Commentary, Statistics, Highlights)
  useEffect(() => {
    const fetchLiveTv = async () => {
      if (!matchId || matchId === 'undefined') return;
      
      // Delay this request significantly to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      setIsLoadingTv(true);
      try {
        const sportSid = getSportSID(sport || 'Cricket');
        const response = await getBetfairScoreTv(matchId, sportSid);
        
        if (response?.success && response.data) {
          const tvData = response.data.data || response.data;
          
          // Extract ALL available URLs
          const extractedData = {
            tv: tvData?.tv_url_three || tvData?.tv_url || tvData?.iframeUrl || tvData?.url || tvData?.liveUrl,
            scorecard: tvData?.scorecard_url || tvData?.scorecardUrl || tvData?.scorecard,
            commentary: tvData?.commentary_url || tvData?.commentaryUrl || tvData?.commentary,
            statistics: tvData?.statistics_url || tvData?.statsUrl || tvData?.statistics || tvData?.stats,
            highlights: tvData?.highlights_url || tvData?.highlightsUrl || tvData?.highlights,
            alternateStreams: [
              tvData?.tv_url,
              tvData?.tv_url_two,
              tvData?.liveUrl,
              tvData?.hlsUrl,
              tvData?.streamUrl,
              tvData?.m3u8,
              tvData?.stream_url
            ].filter(Boolean) // Remove null/undefined
          };
          
          setBetfairData(extractedData);
          setLiveTvUrl(extractedData.tv); // Keep for backward compatibility
        }
      } catch (error) {
        console.error('Error fetching Betfair data:', error);
      } finally {
        setIsLoadingTv(false);
      }
    };

    fetchLiveTv();
  }, [matchId, match?.status, sport, getBetfairScoreTv]);

  // Fetch detailed match data using getDetailsData
  const fetchMatchDetailsData = async () => {
    if (!matchId || matchId === 'undefined') return;
    
    setIsLoadingDetails(true);
    try {
      const sid = getSportSID(sport || 'Cricket');
      const response = await getDetailsData(sid, matchId);
      
      if (response?.success && response.data?.data) {
        // Extract the first match from the array and map fields
        const rawMatch = Array.isArray(response.data.data) 
          ? response.data.data[0] 
          : response.data.data;
        
        if (rawMatch) {
          // Map Diamond API fields to expected UI fields
          const mappedDetails = {
            matchName: rawMatch.ename || `Match #${rawMatch.gmid}`,
            series: rawMatch.cname || 'N/A',
            matchType: rawMatch.gtype || 'match',
            startDate: rawMatch.stime || null,
            status: rawMatch.iplay ? 'Live' : 'Scheduled',
            matchId: rawMatch.gmid,
            eventId: rawMatch.etid,
            competitionId: rawMatch.cid,
            // Additional flags
            hasTv: rawMatch.tv || false,
            hasBookmaker: rawMatch.bm || false,
            hasFancy: rawMatch.f || false,
            hasScorecard: rawMatch.scard === 1
          };
          
          setMatchDetails(mappedDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchMatchDetailsData();
  }, [matchId, sport, getDetailsData]);

  // Fetch live match details and score (lower priority, delayed)
  useEffect(() => {
    const fetchLiveMatchData = async () => {
      if (!matchId || matchId === 'undefined') return;

      // Delay significantly to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 12000));

      try {
        // Fetch one at a time with delays between each
        const scoreResponse = await callAPI(`sports/sportsScore`, { params: { eventId: matchId } });
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const detailsResponse = await callAPI(`sports/allGameDetails`, { params: { eventId: matchId } });
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const matchResponse = await callAPI(`sports/esid`, { sid: '4' });

        if (scoreResponse?.success) {
          setLiveScore(scoreResponse.data);
        }

        if (detailsResponse?.success) {
          setLiveDetails(detailsResponse.data);
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

    // Initial fetch only, no auto-refresh
    fetchLiveMatchData();
  }, [matchId, callAPI]);

  // Fetch odds once on mount (no auto-refresh or WebSocket)
  useEffect(() => {
    if (!matchId || matchId === 'undefined') {
      const errorMsg = 'Invalid match ID. Please select a valid match.';
      setOddsError(errorMsg);
      return;
    }
    
    setIsLoadingOdds(true);
    setOddsError(null);
    
    // Sequential fetch to avoid rate limiting
    const fetchDataSequentially = async () => {
      try {
        // 1. Fetch odds first (highest priority)
        const sid = getSportSID(sport || 'Cricket');
        const oddsResponse = await getPriveteData(sid, matchId);
        
        if (oddsResponse?.success && oddsResponse.data) {
          setOdds(oddsResponse.data);
          setOddsError(null);
        }
        
        // 2. Wait before next request to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        // 3. Fetch match details
        await fetchMatchDetailsData();
        
      } catch (error: any) {
        // Error handling without logging
      } finally {
        setIsLoadingOdds(false);
      }
    };
    
    fetchDataSequentially();
  }, [matchId, sport, getPriveteData]);

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
    // Open bet slip drawer on mobile
    if (isMobile) {
      setIsBetSlipOpen(true);
    }
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

  // Bet Slip Component (reusable for desktop sidebar and mobile drawer)
  const BetSlipContent = () => (
    <>
      {selectedBet ? (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm sm:text-base">{selectedBet.matchName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{selectedBet.selection}</p>
            <div className="flex justify-between mt-2">
              <Badge variant={selectedBet.type === 'back' ? 'default' : 'destructive'}>
                {selectedBet.type.toUpperCase()}
              </Badge>
              <span className="font-bold">{selectedBet.rate}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="bet-amount" className="text-sm">Stake Amount (₹)</Label>
            <Input
              id="bet-amount"
              type="number"
              placeholder="Enter amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="mt-1 h-12 text-base"
            />
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[100, 500, 1000, 5000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount.toString())}
                  className="h-10"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
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
              className="w-full h-12"
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
                if (isMobile) setIsBetSlipOpen(false);
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
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/sports')}
            className="mb-4 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl break-words">
                    {match.team1} vs {match.team2}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    <Badge 
                      variant={match.status === 'Live' ? 'destructive' : 'secondary'} 
                      className={`text-xs sm:text-sm ${match.status === 'Live' ? 'animate-pulse' : ''}`}
                    >
                      {match.status || 'Upcoming'}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">{sport}</Badge>
                    {match.league && <Badge variant="outline" className="hidden sm:inline-flex text-xs sm:text-sm">{match.league}</Badge>}
                    {match.status === 'Live' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/30 text-xs sm:text-sm">
                        🔴 LIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                  {liveScore ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {liveScore.runs}/{liveScore.wickets}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Overs: {liveScore.overs} | RR: {liveScore.runRate}
                      </p>
                    </div>
                  ) : match.score ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">{match.score}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Current Score</p>
                    </div>
                  ) : matchDetails?.status === 'Live' ? (
                    <div className="bg-primary/10 rounded-lg p-2 sm:p-3">
                      <p className="text-sm sm:text-base font-semibold text-primary">Match In Progress</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Live score updating soon</p>
                    </div>
                  ) : matchDetails?.startDate ? (
                    <div className="bg-muted rounded-lg p-2 sm:p-3 min-w-[140px] sm:min-w-[160px]">
                      <p className="text-xs font-medium text-muted-foreground">Starts at</p>
                      <p className="text-sm sm:text-base font-bold mt-0.5">
                        {new Date(matchDetails.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(matchDetails.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center sm:text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Score not available</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later</p>
                    </div>
                  )}
                </div>
              </div>
              {liveDetails && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.fours || '0'}</p>
                    <p className="text-xs text-muted-foreground">Fours</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.sixes || '0'}</p>
                    <p className="text-xs text-muted-foreground">Sixes</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.extras || '0'}</p>
                    <p className="text-xs text-muted-foreground">Extras</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.runRate || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Run Rate</p>
                  </div>
                </div>
              )}

              {/* Live Scorecard Embed */}
              {betfairData.scorecard && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Live Scorecard
                    </h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/30">
                      Ball-by-Ball
                    </Badge>
                  </div>
                  <div className="relative w-full bg-background rounded-lg overflow-hidden border" style={{ height: '400px' }}>
                    <iframe
                      src={betfairData.scorecard}
                      className="w-full h-full"
                      title="Live Scorecard"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="odds" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="odds" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
              <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">ODDS</span>
            </TabsTrigger>
            <TabsTrigger value="matchbet" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Target className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Match Bet</span>
              <span className="text-xs sm:text-sm sm:hidden">Bet</span>
            </TabsTrigger>
            <TabsTrigger value="livetv" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Tv className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Live TV</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
              <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Details</span>
              <span className="text-xs sm:text-sm sm:hidden">Info</span>
            </TabsTrigger>
          </TabsList>

          {/* ODDS Tab */}
          <TabsContent value="odds" className="space-y-4 sm:space-y-6">
            {/* Error Alert with Refresh */}
            {oddsError && (
              <Alert className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{oddsError}</p>
                    <p className="text-xs text-muted-foreground">The API has rate limits. Please wait a moment before refreshing.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className={isMobile ? "space-y-4" : "grid lg:grid-cols-3 gap-6"}>
              <div className="lg:col-span-2">
                <EnhancedOddsDisplay 
                  odds={odds}
                  selectedBet={selectedBet}
                  onSelectBet={handleSelectBet}
                  isLoading={isLoadingOdds}
                />
              </div>

              {/* Desktop Bet Slip - Hidden on Mobile */}
              {!isMobile && (
                <div>
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle>Bet Slip</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BetSlipContent />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Match Bet Tab */}
          <TabsContent value="matchbet" className={isMobile ? "space-y-4" : "space-y-6"}>
            <Card>
              <CardHeader className={isMobile ? "p-4" : ""}>
                <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Place Your Bet</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-4" : ""}>
                {selectedBet ? (
                  <div className={isMobile ? "space-y-3" : "space-y-4"}>
                    <div className={isMobile ? "p-3 bg-muted rounded-lg" : "p-4 bg-muted rounded-lg"}>
                      <p className={isMobile ? "font-semibold text-sm" : "font-semibold text-lg"}>
                        {selectedBet.matchName}
                      </p>
                      <p className={isMobile ? "text-xs text-muted-foreground mt-1" : "text-sm text-muted-foreground mt-1"}>
                        {selectedBet.selection}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <Badge 
                          variant={selectedBet.type === 'back' ? 'default' : 'destructive'} 
                          className={isMobile ? "text-xs" : "text-base"}
                        >
                          {selectedBet.type.toUpperCase()}
                        </Badge>
                        <span className={isMobile ? "font-bold text-lg" : "font-bold text-xl"}>
                          {selectedBet.rate}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label 
                        htmlFor="bet-amount-main" 
                        className={isMobile ? "text-xs" : "text-sm"}
                      >
                        Stake Amount (₹)
                      </Label>
                      <Input
                        id="bet-amount-main"
                        type="number"
                        placeholder="Enter amount"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className={isMobile ? "mt-1.5 h-12 text-base" : "mt-2 text-lg p-6"}
                      />
                      
                      {/* Quick Amount Buttons for Mobile */}
                      {isMobile && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[100, 500, 1000, 5000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => setBetAmount(amount.toString())}
                              className="h-9 text-xs"
                            >
                              ₹{amount}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className={isMobile ? "p-3 bg-primary/10 rounded-lg" : "p-4 bg-primary/10 rounded-lg"}>
                        <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Potential Win
                        </p>
                        <p className={isMobile ? "text-lg font-bold text-primary mt-1" : "text-2xl font-bold text-primary mt-1"}>
                          ₹{calculatePotentialWin().toFixed(2)}
                        </p>
                      </div>
                      <div className={isMobile ? "p-3 bg-destructive/10 rounded-lg" : "p-4 bg-destructive/10 rounded-lg"}>
                        <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Liability
                        </p>
                        <p className={isMobile ? "text-lg font-bold text-destructive mt-1" : "text-2xl font-bold text-destructive mt-1"}>
                          ₹{calculateLiability().toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={isMobile ? "space-y-2 pt-2" : "space-y-3"}>
                      <Button
                        className={isMobile ? "w-full h-12 text-base" : "w-full text-lg py-6"}
                        onClick={handlePlaceBet}
                        disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
                      >
                        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                      </Button>
                      <Button
                        variant="outline"
                        className={isMobile ? "w-full h-10 text-sm" : "w-full"}
                        onClick={() => {
                          setSelectedBet(null);
                          setBetAmount('');
                        }}
                      >
                        Clear Bet Slip
                      </Button>
                    </div>
                    
                    <div className={isMobile ? "mt-4 pt-3 border-t" : "mt-6 pt-4 border-t"}>
                      <div className="flex justify-between items-center">
                        <span className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Wallet Balance:
                        </span>
                        <span className={isMobile ? "font-bold text-base" : "font-bold text-xl"}>
                          ₹{wallet ? ((wallet as any).balance || 0).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={isMobile ? "text-center py-8" : "text-center py-12"}>
                    <p className={isMobile ? "text-muted-foreground text-base mb-3" : "text-muted-foreground text-lg mb-4"}>
                      No bet selected
                    </p>
                    <p className="text-sm text-muted-foreground">Go to ODDS tab to select a bet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live TV Tab */}
          <TabsContent value="livetv" className="space-y-6">
            <EnhancedLiveTVSection
              matchId={matchId!}
              match={match}
              isLive={match?.status === 'Live'}
              betfairData={betfairData}
            />
          </TabsContent>

          {/* Match Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Match Information</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMatchDetailsData}
                    disabled={isLoadingDetails}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDetails ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Loading State */}
                {isLoadingDetails && (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}

                {/* Match Details Content */}
                {!isLoadingDetails && matchDetails && Object.keys(matchDetails).length > 0 && (
                  <div className="space-y-6">
                    {/* Basic Info Section */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchDetails.matchName && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Match Name</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.matchName}</p>
                        </div>
                      )}
                      {matchDetails.series && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Series</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.series}</p>
                        </div>
                      )}
                      {matchDetails.matchType && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Match Type</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.matchType}</p>
                        </div>
                      )}
                      {matchDetails.venue && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Venue</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.venue}</p>
                        </div>
                      )}
                        {matchDetails.startDate && (
                          <div className="p-4 bg-muted rounded-lg col-span-full">
                            <p className="text-sm text-muted-foreground mb-1">Start Date & Time</p>
                            <p className="font-semibold">{new Date(matchDetails.startDate).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Status Section */}
                    {(matchDetails.tossWinner || matchDetails.currentInnings || matchDetails.status) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          Match Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.tossWinner && (
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-sm text-muted-foreground mb-1">Toss Winner</p>
                              <p className="font-semibold text-primary">{matchDetails.tossWinner}</p>
                              {matchDetails.tossDecision && (
                                <p className="text-sm mt-1">Decision: <span className="font-medium">{matchDetails.tossDecision}</span></p>
                              )}
                            </div>
                          )}
                          {matchDetails.currentInnings && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Current Innings</p>
                              <p className="font-semibold">{matchDetails.currentInnings}</p>
                            </div>
                          )}
                          {matchDetails.status && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              <p className="font-semibold">{matchDetails.status}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Officials Section */}
                    {(matchDetails.referee || matchDetails.umpires) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Match Officials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.referee && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Referee</p>
                              <p className="font-semibold">{matchDetails.referee}</p>
                            </div>
                          )}
                          {matchDetails.umpires && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Umpires</p>
                              <p className="font-semibold">{matchDetails.umpires}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditions Section */}
                    {(matchDetails.weather || matchDetails.pitch) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Cloud className="h-5 w-5 text-primary" />
                          Match Conditions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.weather && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Weather</p>
                              <p className="font-semibold">{matchDetails.weather}</p>
                            </div>
                          )}
                          {matchDetails.pitch && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Pitch Condition</p>
                              <p className="font-semibold">{matchDetails.pitch}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingDetails && (!matchDetails || Object.keys(matchDetails).length === 0) && (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Details Available</h3>
                    <p className="text-muted-foreground mb-4">Match details are not available at this moment.</p>
                    <Button
                      variant="outline"
                      onClick={fetchMatchDetailsData}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Fallback match info if no detailed data */}
                {!matchDetails && !isLoadingDetails && (
                  <>
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
                  </>
                )}

                {/* Live Statistics */}
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

                {!matchDetails && !liveDetails && !isLoadingDetails && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Match details will appear when available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile Floating Bet Slip Drawer */}
        {isMobile && (
          <Drawer open={isBetSlipOpen} onOpenChange={setIsBetSlipOpen}>
            <DrawerTrigger asChild>
              <Button 
                size="lg"
                className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
                onClick={() => setIsBetSlipOpen(true)}
              >
                <Receipt className="h-6 w-6" />
                {selectedBet && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Bet Slip</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto p-4">
                <BetSlipContent />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
};

export default SportsBet;