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
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
          {odds.map((odd, idx) => (
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
      </CardContent>
    </Card>
  );
};