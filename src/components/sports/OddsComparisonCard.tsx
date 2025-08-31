import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  ArrowUpDown,
  Trophy,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OddsData {
  bookmaker: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  backPrice?: number;
  layPrice?: number;
  liquidity?: number;
  isExchange?: boolean;
}

interface OddsComparisonCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  matchTime: string;
  odds: OddsData[];
  onBet: (selection: string, odds: number, bookmaker: string) => void;
  featured?: boolean;
}

export const OddsComparisonCard: React.FC<OddsComparisonCardProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  sport,
  matchTime,
  odds,
  onBet,
  featured = false
}) => {
  const [selectedMarket, setSelectedMarket] = useState<'home' | 'away' | 'draw' | null>(null);
  
  // Find best odds for each outcome
  const bestHomeOdds = Math.max(...odds.map(o => o.homeOdds || o.backPrice || 0));
  const bestAwayOdds = Math.max(...odds.map(o => o.awayOdds || o.backPrice || 0));
  const bestDrawOdds = sport === 'football' ? Math.max(...odds.map(o => o.drawOdds || 0)) : null;
  
  // Find Betfair Exchange data
  const betfairData = odds.find(o => o.isExchange);
  
  const getOddsColor = (currentOdds: number, bestOdds: number) => {
    if (currentOdds === bestOdds) return 'text-gaming-success font-bold';
    if (currentOdds >= bestOdds * 0.95) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      featured && "border-gaming-gold shadow-lg shadow-gaming-gold/20 scale-[1.02]"
    )}>
      {featured && (
        <div className="bg-gradient-to-r from-gaming-gold to-gaming-gold/50 px-4 py-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">Featured Match</span>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{homeTeam} vs {awayTeam}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">{sport}</Badge>
              <span>{new Date(matchTime).toLocaleDateString()}</span>
            </div>
          </div>
          {betfairData && betfairData.liquidity && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Liquidity</div>
              <div className="font-bold text-gaming-success">
                ${(betfairData.liquidity / 1000).toFixed(1)}K
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Odds Comparison</TabsTrigger>
            <TabsTrigger value="exchange">Betfair Exchange</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-3">
            {/* Outcome buttons with best odds */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedMarket === 'home' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMarket('home')}
                className="flex flex-col h-auto py-2"
              >
                <span className="text-xs opacity-75">{homeTeam}</span>
                <span className="text-lg font-bold">{bestHomeOdds.toFixed(2)}</span>
              </Button>
              
              {sport === 'football' && bestDrawOdds && (
                <Button
                  variant={selectedMarket === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMarket('draw')}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="text-xs opacity-75">Draw</span>
                  <span className="text-lg font-bold">{bestDrawOdds.toFixed(2)}</span>
                </Button>
              )}
              
              <Button
                variant={selectedMarket === 'away' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMarket('away')}
                className={cn(
                  "flex flex-col h-auto py-2",
                  sport !== 'football' && "col-span-2"
                )}
              >
                <span className="text-xs opacity-75">{awayTeam}</span>
                <span className="text-lg font-bold">{bestAwayOdds.toFixed(2)}</span>
              </Button>
            </div>

            {/* Bookmaker odds list */}
            <div className="space-y-2">
              {odds.filter(o => !o.isExchange).map((odd, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{odd.bookmaker}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("h-7 px-2", getOddsColor(odd.homeOdds, bestHomeOdds))}
                      onClick={() => onBet(homeTeam, odd.homeOdds, odd.bookmaker)}
                    >
                      {odd.homeOdds.toFixed(2)}
                    </Button>
                    {sport === 'football' && odd.drawOdds && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn("h-7 px-2", getOddsColor(odd.drawOdds, bestDrawOdds!))}
                        onClick={() => onBet('Draw', odd.drawOdds!, odd.bookmaker)}
                      >
                        {odd.drawOdds.toFixed(2)}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("h-7 px-2", getOddsColor(odd.awayOdds, bestAwayOdds))}
                      onClick={() => onBet(awayTeam, odd.awayOdds, odd.bookmaker)}
                    >
                      {odd.awayOdds.toFixed(2)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="exchange" className="space-y-3">
            {betfairData ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gaming-primary/10">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gaming-primary" />
                    <span className="text-sm font-medium">Betfair Exchange</span>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">
                    Live
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Home Team */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-center">{homeTeam}</div>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        size="sm"
                        className="bg-gaming-primary/20 hover:bg-gaming-primary/30 text-gaming-primary flex flex-col h-auto py-1"
                        onClick={() => onBet(homeTeam, betfairData.backPrice || 0, 'Betfair Back')}
                      >
                        <span className="text-xs">Back</span>
                        <span className="font-bold">{betfairData.backPrice?.toFixed(2) || '-'}</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gaming-danger/20 hover:bg-gaming-danger/30 text-gaming-danger flex flex-col h-auto py-1"
                        onClick={() => onBet(homeTeam, betfairData.layPrice || 0, 'Betfair Lay')}
                      >
                        <span className="text-xs">Lay</span>
                        <span className="font-bold">{betfairData.layPrice?.toFixed(2) || '-'}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-center">{awayTeam}</div>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        size="sm"
                        className="bg-gaming-primary/20 hover:bg-gaming-primary/30 text-gaming-primary flex flex-col h-auto py-1"
                        onClick={() => onBet(awayTeam, betfairData.backPrice || 0, 'Betfair Back')}
                      >
                        <span className="text-xs">Back</span>
                        <span className="font-bold">{betfairData.backPrice?.toFixed(2) || '-'}</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gaming-danger/20 hover:bg-gaming-danger/30 text-gaming-danger flex flex-col h-auto py-1"
                        onClick={() => onBet(awayTeam, betfairData.layPrice || 0, 'Betfair Lay')}
                      >
                        <span className="text-xs">Lay</span>
                        <span className="font-bold">{betfairData.layPrice?.toFixed(2) || '-'}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>234 active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${(betfairData.liquidity! / 1000).toFixed(1)}K matched</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Exchange odds not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};