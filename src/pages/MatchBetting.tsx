import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Activity, 
  Clock,
  DollarSign,
  Zap,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Globe,
  Info
} from 'lucide-react';
import { useSportsOdds, type BettingOdds } from '@/hooks/useSportsOdds';
import { BetfairOddsCard } from '@/components/sports/BetfairOddsCard';
import { BetfairLadderCard } from '@/components/sports/BetfairLadderCard';
import { BettingInterface } from '@/components/sports/BettingInterface';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BetSlip {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number;
  bookmaker: string;
  stake: number;
  potentialWin: number;
  isExchange?: boolean;
  type: 'back' | 'lay';
}

const MatchBetting: React.FC = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchOdds, loading, error } = useSportsOdds();
  
  const [matchData, setMatchData] = useState<any>(null);
  const [betSlips, setBetSlips] = useState<BetSlip[]>([]);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get match info from navigation state or fetch it
  const { homeTeam, awayTeam, sport, matchTime, liquidity } = location.state || {};

  useEffect(() => {
    document.title = `${homeTeam || 'Match'} vs ${awayTeam || 'Match'} - Betting`;
    loadMatchOdds();
  }, [matchId]);

  const loadMatchOdds = async () => {
    try {
      const response = await fetchOdds(sport || 'football', matchId, {
        provider: 'betfair',
        markets: ['h2h', 'spreads', 'totals'],
        region: 'uk'
      });
      
      // Find the specific match
      const match = response.data.find((m: any) => m.id === matchId) || response.data[0];
      setMatchData(match);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load match odds:', err);
    }
  };

  const handleRefresh = () => {
    loadMatchOdds();
    toast({
      title: "Odds Refreshed",
      description: "Latest Betfair Exchange odds loaded",
    });
  };

  const handleBet = (selection: string, odds: number, type: 'back' | 'lay' = 'back', size?: number) => {
    const betId = `${matchId}-${selection}-${type}-${Date.now()}`;
    const newBet: BetSlip = {
      id: betId,
      matchId: matchId || '',
      homeTeam: homeTeam || matchData?.home_team || 'Home',
      awayTeam: awayTeam || matchData?.away_team || 'Away',
      selection,
      odds,
      bookmaker: 'Betfair Exchange',
      stake: size ? Math.min(size, 100) : 10,
      potentialWin: (size ? Math.min(size, 100) : 10) * odds,
      isExchange: true,
      type
    };
    
    setBetSlips([...betSlips, newBet]);
    setIsBetSlipOpen(true);
    
    toast({
      title: "Added to Bet Slip",
      description: `${selection} @ ${odds} ${type === 'lay' ? '(Lay)' : '(Back)'}`,
    });
  };

  const updateBetStake = (id: string, stake: number) => {
    setBetSlips(betSlips.map(bet => 
      bet.id === id 
        ? { ...bet, stake, potentialWin: stake * bet.odds }
        : bet
    ));
  };

  const removeBet = (id: string) => {
    setBetSlips(betSlips.filter(bet => bet.id !== id));
  };

  const placeBets = () => {
    setBetSlips([]);
    setIsBetSlipOpen(false);
    toast({
      title: "Bets Placed",
      description: "Your bets have been successfully placed",
    });
  };

  const extractBetfairOdds = (match: any) => {
    const betfairData = match?.bookmakers?.[0];
    const outcomes = betfairData?.markets?.[0]?.outcomes || [];
    
    return {
      backPrices: {
        home: outcomes[0]?.backPrice || 0,
        away: outcomes[1]?.backPrice || 0,
        draw: outcomes[2]?.backPrice || null
      },
      layPrices: {
        home: outcomes[0]?.layPrice || 0,
        away: outcomes[1]?.layPrice || 0,
        draw: outcomes[2]?.layPrice || null
      },
      liquidity: match?.liquidity || liquidity || 0
    };
  };

  const matchDate = new Date(matchTime || matchData?.commence_time || new Date());
  const isLive = matchDate <= new Date();
  const betfairOdds = matchData ? extractBetfairOdds(matchData) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button and Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Matches
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={isLive ? "destructive" : "secondary"} className="text-sm">
                  {isLive ? (
                    <>
                      <Activity className="w-3 h-3 mr-1 animate-pulse" />
                      LIVE
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      {matchDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="text-sm capitalize">
                  {sport || 'Football'}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                {homeTeam || matchData?.home_team || 'Home Team'} 
                <span className="text-muted-foreground mx-3">vs</span>
                {awayTeam || matchData?.away_team || 'Away Team'}
              </h1>
              
              <p className="text-muted-foreground">
                {matchDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsBetSlipOpen(!isBetSlipOpen)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {betSlips.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {betSlips.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Match Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Liquidity</p>
                  <p className="text-2xl font-bold">
                    ${(betfairOdds?.liquidity || 0) > 1000 
                      ? `${((betfairOdds?.liquidity || 0) / 1000).toFixed(1)}K` 
                      : (betfairOdds?.liquidity || 0).toFixed(0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gaming-gold opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exchange</p>
                  <p className="text-2xl font-bold">Betfair</p>
                </div>
                <Zap className="h-8 w-8 text-gaming-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-lg font-bold">{lastRefresh.toLocaleTimeString()}</p>
                </div>
                <Clock className="h-8 w-8 text-gaming-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting Markets */}
        <Alert className="mb-6">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Betfair Exchange</strong> - Trade on back and lay prices with live market liquidity
          </AlertDescription>
        </Alert>

        {/* Odds Display */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading odds...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !matchData ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No odds available for this match</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Quick Bet</TabsTrigger>
              <TabsTrigger value="ladders">Full Market Depth</TabsTrigger>
              <TabsTrigger value="details">Market Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <BetfairOddsCard
                matchId={matchId || ''}
                homeTeam={homeTeam || matchData.home_team || 'Home Team'}
                awayTeam={awayTeam || matchData.away_team || 'Away Team'}
                sport={sport || 'football'}
                matchTime={matchTime || matchData.commence_time || new Date().toISOString()}
                backPrices={betfairOdds?.backPrices || { home: 0, away: 0, draw: null }}
                layPrices={betfairOdds?.layPrices || { home: 0, away: 0, draw: null }}
                liquidity={betfairOdds?.liquidity || 0}
                onBet={handleBet}
                featured={true}
              />
            </TabsContent>

            <TabsContent value="ladders" className="space-y-4">
              {matchData?.bookmakers?.[0]?.markets?.[0]?.outcomes?.map((outcome: any) => (
                <BetfairLadderCard
                  key={outcome.name}
                  runnerName={outcome.name}
                  backLadder={outcome.backLadder || []}
                  layLadder={outcome.layLadder || []}
                  lastPriceTraded={outcome.lastPriceTraded}
                  totalMatched={outcome.totalMatched}
                  tradedVolume={outcome.tradedVolume}
                  onBet={handleBet}
                />
              ))}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {/* Event Details */}
              {matchData?.betfair?.event && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Event Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Event Name</p>
                      <p className="font-medium">{matchData.betfair.event.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event ID</p>
                      <p className="font-mono text-xs">{matchData.betfair.event.id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Venue</p>
                      <p className="font-medium">{matchData.betfair.event.venue || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{matchData.betfair.event.countryCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timezone</p>
                      <p className="font-medium">{matchData.betfair.event.timezone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Open Date</p>
                      <p className="font-medium">
                        {matchData.betfair.event.openDate 
                          ? new Date(matchData.betfair.event.openDate).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Details */}
              {matchData?.betfair?.market && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Market Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Name</p>
                      <p className="font-medium">{matchData.betfair.market.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market ID</p>
                      <p className="font-mono text-xs">{matchData.betfair.market.id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Type</p>
                      <p className="font-medium">{matchData.betfair.market.type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-medium">
                        {matchData.betfair.market.startTime 
                          ? new Date(matchData.betfair.market.startTime).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Book Details */}
              {matchData?.betfair?.marketBook && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Live Market Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={matchData.betfair.marketBook.status === 'OPEN' ? 'default' : 'secondary'}>
                        {matchData.betfair.marketBook.status || '—'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">In-Play</p>
                      <Badge variant={matchData.betfair.marketBook.inplay ? 'destructive' : 'outline'}>
                        {matchData.betfair.marketBook.inplay ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Matched</p>
                      <p className="font-bold text-lg">
                        ${(matchData.betfair.marketBook.totalMatched / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Available</p>
                      <p className="font-bold text-lg">
                        ${(matchData.betfair.marketBook.totalAvailable / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bet Delay</p>
                      <p className="font-medium">{matchData.betfair.marketBook.betDelay || 0} seconds</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Match Time</p>
                      <p className="font-medium">
                        {matchData.betfair.marketBook.lastMatchTime 
                          ? new Date(matchData.betfair.marketBook.lastMatchTime).toLocaleTimeString()
                          : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competition Details */}
              {matchData?.betfair?.competition && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Competition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Competition Name</p>
                      <p className="font-medium">{matchData.betfair.competition.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Competition ID</p>
                      <p className="font-mono text-xs">{matchData.betfair.competition.id || '—'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Betting Interface */}
      <BettingInterface
        isOpen={isBetSlipOpen}
        onClose={() => setIsBetSlipOpen(false)}
        betSlips={betSlips}
        onUpdateStake={updateBetStake}
        onRemoveBet={removeBet}
        onPlaceBets={placeBets}
      />
    </div>
  );
};

export default MatchBetting;