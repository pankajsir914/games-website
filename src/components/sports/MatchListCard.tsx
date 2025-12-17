import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  Activity,
  DollarSign,
  ArrowRight,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MatchListCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  matchTime: string;
  liquidity: number;
  oddsCount: number;
  featured?: boolean;
}

export const MatchListCard: React.FC<MatchListCardProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  sport,
  matchTime,
  liquidity,
  oddsCount,
  featured = false
}) => {
  const navigate = useNavigate();
  const matchDate = new Date(matchTime);
  const isLive = matchDate <= new Date();
  
  const handleClick = () => {
    navigate(`/sports/match/${matchId}`, { 
      state: { 
        homeTeam, 
        awayTeam, 
        sport, 
        matchTime,
        liquidity 
      } 
    });
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg cursor-pointer",
        featured && "border-gaming-primary shadow-gaming-primary/20"
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
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
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{homeTeam}</h3>
              <p className="text-sm text-muted-foreground">vs</p>
              <h3 className="font-semibold text-lg">{awayTeam}</h3>
            </div>
          </div>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{oddsCount}</span>
              <span className="text-muted-foreground">markets</span>
            </div>
            
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                ${liquidity > 1000 ? `${(liquidity / 1000).toFixed(1)}K` : liquidity.toFixed(0)}
              </span>
              <span className="text-muted-foreground">liquidity</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gaming-primary">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">View Odds</span>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground text-center">
          {matchDate.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </CardContent>
    </Card>
  );
};