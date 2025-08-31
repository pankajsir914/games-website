import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  Trophy,
  Zap,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  Info,
  Clock,
  Users
} from 'lucide-react';
import { useSportsOdds } from '@/hooks/useSportsOdds';
import { BetfairOddsCard } from '@/components/sports/BetfairOddsCard';
import { BettingInterface } from '@/components/sports/BettingInterface';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const sportsList = ['football', 'cricket', 'tennis', 'basketball', 'horse-racing'];

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

const SportsBetting: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchOdds, loading, error } = useSportsOdds();
  
  const [selectedSport, setSelectedSport] = useState('football');
  const [oddsData, setOddsData] = useState<any[]>([]);
  const [betSlips, setBetSlips] = useState<BetSlip[]>([]);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    document.title = 'Sports Betting - Betfair Exchange';
    loadOdds();
  }, [selectedSport]);

  const loadOdds = async () => {
    try {
      const odds = await fetchOdds(selectedSport, undefined, {
        provider: 'betfair',
        markets: ['h2h'],
        region: 'uk'
      });
      setOddsData(odds);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load odds:', err);
    }
  };

  const handleRefresh = () => {
    loadOdds();
    toast({
      title: "Odds Refreshed",
      description: "Latest Betfair Exchange odds loaded",
    });
  };

  const handleBet = (matchId: string, match: any, selection: string, odds: number, type: 'back' | 'lay' = 'back') => {
    const betId = `${matchId}-${selection}-${type}-${Date.now()}`;
    const newBet: BetSlip = {
      id: betId,
      matchId,
      homeTeam: match.home_team || 'Home',
      awayTeam: match.away_team || 'Away',
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
  };

  // Extract Betfair odds from match data
  const extractBetfairOdds = (match: any) => {
    const betfairData = match.bookmakers?.[0];
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
      liquidity: match.liquidity || 0
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gaming-primary to-gaming-accent bg-clip-text text-transparent">
                Betfair Exchange
              </h1>
              <p className="text-muted-foreground mt-1">
                Trade on live sports with back and lay betting
              </p>
            </div>
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

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sportsList.map(sport => (
                  <SelectItem key={sport} value={sport} className="capitalize">
                    {sport.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh Odds
            </Button>

            <div className="flex-1 flex justify-end items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Markets</p>
                    <p className="text-2xl font-bold">{oddsData.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-gaming-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange</p>
                    <p className="text-lg font-bold">Betfair</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gaming-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Liquidity</p>
                    <p className="text-2xl font-bold">
                      ${(oddsData.reduce((sum, m) => sum + (m.liquidity || 0), 0) / 1000).toFixed(1)}K
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
                    <p className="text-sm text-muted-foreground">Live Users</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <Users className="h-8 w-8 text-gaming-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-6">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Betfair Exchange</strong> - Trade on back and lay prices with live market liquidity
            </AlertDescription>
          </Alert>
        </div>

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
          ) : oddsData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No markets available</p>
                <p className="text-sm text-muted-foreground mt-2">Try selecting a different sport or provider</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {oddsData.slice(0, 10).map((match, idx) => {
                const betfairOdds = extractBetfairOdds(match);
                return (
                  <BetfairOddsCard
                    key={match.id || idx}
                    matchId={match.id || `match-${idx}`}
                    homeTeam={match.home_team || 'Home Team'}
                    awayTeam={match.away_team || 'Away Team'}
                    sport={selectedSport}
                    matchTime={match.commence_time || new Date().toISOString()}
                    backPrices={betfairOdds.backPrices}
                    layPrices={betfairOdds.layPrices}
                    liquidity={betfairOdds.liquidity}
                    onBet={(selection, odds, type) => 
                      handleBet(match.id || `match-${idx}`, match, selection, odds, type)
                    }
                    featured={idx === 0}
                  />
                );
              })}
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

export default SportsBetting;