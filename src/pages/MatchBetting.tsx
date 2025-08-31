import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Activity, 
  Clock,
  DollarSign,
  Zap,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { useSportsOdds } from '@/hooks/useSportsOdds';
import { BetfairOddsCard } from '@/components/sports/BetfairOddsCard';
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
      const odds = await fetchOdds(sport || 'football', matchId, {
        provider: 'betfair',
        markets: ['h2h', 'spreads', 'totals'],
        region: 'uk'
      });
      
      // Find the specific match
      const match = odds.find((m: any) => m.id === matchId) || odds[0];
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

  const handleBet = (selection: string, odds: number, type: 'back' | 'lay' = 'back') => {
    const betId = `${matchId}-${selection}-${type}-${Date.now()}`;
    const newBet: BetSlip = {
      id: betId,
      matchId: matchId || '',
      homeTeam: homeTeam || matchData?.home_team || 'Home',
      awayTeam: awayTeam || matchData?.away_team || 'Away',
      selection,
      odds,
      bookmaker: 'Betfair Exchange',
      stake: 10,
      potentialWin: 10 * odds,
      isExchange: true,
      type
    };
    
    setBetSlips([...betSlips, newBet]);
    setIsBetSlipOpen(true);
    
    toast({
      title: "Added to Bet Slip",
      description: `${selection} @ ${odds}`,
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
        <div className="space-y-6">
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
            <div className="max-w-3xl mx-auto space-y-6">
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

              {/* Betfair market details */}
              {matchData?.betfair && (
                <Card>
                  <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Competition</p>
                      <p className="font-medium">{matchData?.competition || matchData?.betfair?.competition?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Venue</p>
                      <p className="font-medium">{matchData?.betfair?.event?.venue || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{matchData?.betfair?.event?.countryCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Status</p>
                      <p className="font-medium capitalize">{matchData?.betfair?.marketBook?.status?.toLowerCase() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">In-Play</p>
                      <p className="font-medium">{matchData?.betfair?.marketBook?.inplay ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Matched</p>
                      <p className="font-medium">{matchData?.betfair?.marketBook?.totalMatched?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Available</p>
                      <p className="font-medium">{matchData?.betfair?.marketBook?.totalAvailable?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bet Delay</p>
                      <p className="font-medium">{matchData?.betfair?.marketBook?.betDelay ?? 0}s</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
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