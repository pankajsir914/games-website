import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetfairOddsCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  matchTime: string;
  backPrices: {
    home: number;
    away: number;
    draw?: number;
  };
  layPrices: {
    home: number;
    away: number;
    draw?: number;
  };
  liquidity: number;
  onBet: (selection: string, odds: number, type: 'back' | 'lay') => void;
  featured?: boolean;
}

export const BetfairOddsCard: React.FC<BetfairOddsCardProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  sport,
  matchTime,
  backPrices,
  layPrices,
  liquidity,
  onBet,
  featured = false
}) => {
  const matchDate = new Date(matchTime);
  const isLive = matchDate <= new Date();
  const hasDrawMarket = sport === 'football' || sport === 'soccer';

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      featured && "border-gaming-primary shadow-gaming-primary/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isLive ? "destructive" : "secondary"} className="text-xs">
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
              <Badge variant="outline" className="text-xs capitalize">
                {sport}
              </Badge>
              {featured && (
                <Badge className="bg-gaming-gold text-gaming-gold-foreground text-xs">
                  Featured
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1">{homeTeam}</h3>
            <p className="text-xs text-muted-foreground">vs</p>
            <h3 className="font-semibold text-sm">{awayTeam}</h3>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              Liquidity
            </div>
            <p className="font-bold text-gaming-primary">
              ${liquidity > 1000 ? `${(liquidity / 1000).toFixed(1)}K` : liquidity.toFixed(0)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Back/Lay Headers */}
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
            <div>Market</div>
            <div className="text-center">Back</div>
            <div className="text-center">Lay</div>
          </div>

          {/* Home Team */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="text-sm font-medium truncate">{homeTeam}</div>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "text-xs font-bold transition-all",
                "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
              )}
              onClick={() => onBet(`${homeTeam} Win`, backPrices.home, 'back')}
              disabled={!backPrices.home || backPrices.home === 0}
            >
              {backPrices.home > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {backPrices.home.toFixed(2)}
                </>
              ) : (
                '-'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "text-xs font-bold transition-all",
                "bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30"
              )}
              onClick={() => onBet(`${homeTeam} Win`, layPrices.home, 'lay')}
              disabled={!layPrices.home || layPrices.home === 0}
            >
              {layPrices.home > 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {layPrices.home.toFixed(2)}
                </>
              ) : (
                '-'
              )}
            </Button>
          </div>

          {/* Draw (if applicable) */}
          {hasDrawMarket && (
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium">Draw</div>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "text-xs font-bold transition-all",
                  "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                )}
                onClick={() => onBet('Draw', backPrices.draw || 0, 'back')}
                disabled={!backPrices.draw || backPrices.draw === 0}
              >
                {backPrices.draw && backPrices.draw > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {backPrices.draw.toFixed(2)}
                  </>
                ) : (
                  '-'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "text-xs font-bold transition-all",
                  "bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30"
                )}
                onClick={() => onBet('Draw', layPrices.draw || 0, 'lay')}
                disabled={!layPrices.draw || layPrices.draw === 0}
              >
                {layPrices.draw && layPrices.draw > 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {layPrices.draw.toFixed(2)}
                  </>
                ) : (
                  '-'
                )}
              </Button>
            </div>
          )}

          {/* Away Team */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="text-sm font-medium truncate">{awayTeam}</div>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "text-xs font-bold transition-all",
                "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
              )}
              onClick={() => onBet(`${awayTeam} Win`, backPrices.away, 'back')}
              disabled={!backPrices.away || backPrices.away === 0}
            >
              {backPrices.away > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {backPrices.away.toFixed(2)}
                </>
              ) : (
                '-'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "text-xs font-bold transition-all",
                "bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30"
              )}
              onClick={() => onBet(`${awayTeam} Win`, layPrices.away, 'lay')}
              disabled={!layPrices.away || layPrices.away === 0}
            >
              {layPrices.away > 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {layPrices.away.toFixed(2)}
                </>
              ) : (
                '-'
              )}
            </Button>
          </div>
        </div>

        {/* Exchange Info */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-gaming-primary" />
            Betfair Exchange
          </div>
          <div className="text-xs text-muted-foreground">
            {matchDate.toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};