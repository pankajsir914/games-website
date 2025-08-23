import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Trophy, TrendingUp, Eye, Activity, Users } from 'lucide-react';
import { SportsMatch } from '@/hooks/useSportsData';
import { useBettingOdds } from '@/hooks/useSportsBetting';
import { useNavigate } from 'react-router-dom';

interface FootballMatchCardProps {
  match: SportsMatch;
  onBetSelect?: (odds: any, type: string) => void;
  showBetting?: boolean;
}

export function FootballMatchCard({ match, onBetSelect, showBetting = true }: FootballMatchCardProps) {
  const navigate = useNavigate();
  const { odds } = useBettingOdds(match.sport, match.id);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('half')) return 'destructive';
    if (statusLower.includes('full time') || statusLower.includes('completed')) return 'secondary';
    if (statusLower.includes('not started') || statusLower.includes('upcoming')) return 'default';
    return 'default';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live')) return <Activity className="h-3 w-3 animate-pulse" />;
    if (statusLower.includes('full time')) return <Trophy className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const formatScore = (score: number | null) => {
    return score !== null ? score.toString() : '0';
  };

  const isLive = match.status.toLowerCase().includes('live') || match.status.toLowerCase().includes('half');
  const isCompleted = match.status.toLowerCase().includes('full time') || match.status.toLowerCase().includes('completed');

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card to-card/95 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      {/* Header with League Info */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground/90">{match.league}</span>
          </div>
          <Badge 
            variant={getStatusColor(match.status)} 
            className="flex items-center gap-1 px-2 py-0.5"
          >
            {getStatusIcon(match.status)}
            <span className="text-xs">{match.status}</span>
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Match Time and Venue */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {match.date && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(match.date).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{match.venue}</span>
            </div>
          )}
        </div>

        {/* Main Match Display */}
        <div className="relative">
          {/* Score Display - Prominent for live/completed matches */}
          {(isLive || isCompleted) && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-foreground">
                    {formatScore(match.scores.home)}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatScore(match.scores.away)}
                  </span>
                </div>
                {isLive && (
                  <div className="text-center mt-1">
                    <span className="text-xs text-destructive font-medium animate-pulse">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teams Display */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Home Team */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">HOME</p>
                <p className="font-semibold text-sm text-foreground truncate px-2">
                  {match.teams.home}
                </p>
              </div>
            </div>

            {/* VS or Score */}
            <div className="text-center">
              {!isLive && !isCompleted && (
                <div className="text-xl font-bold text-muted-foreground">VS</div>
              )}
            </div>

            {/* Away Team */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center border-2 border-secondary/30">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">AWAY</p>
                <p className="font-semibold text-sm text-foreground truncate px-2">
                  {match.teams.away}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/sports/bet/${match.sport}/${match.id}`)}
            disabled={isCompleted}
            className="relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Place Bet</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/match-details/${match.sport}/${match.id}`)}
            className="text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View Details
          </Button>
        </div>

        {/* Quick Betting Options */}
        {showBetting && odds.length > 0 && !isCompleted && (
          <div className="pt-3 border-t border-border/50">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBetSelect?.(odds[0], 'home-win')}
                className="flex flex-col py-2 h-auto hover:bg-primary/10 hover:border-primary/50"
              >
                <span className="text-xs text-muted-foreground">Home</span>
                <span className="text-sm font-bold text-primary">2.10</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBetSelect?.(odds[0], 'draw')}
                className="flex flex-col py-2 h-auto hover:bg-primary/10 hover:border-primary/50"
              >
                <span className="text-xs text-muted-foreground">Draw</span>
                <span className="text-sm font-bold text-primary">3.25</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBetSelect?.(odds[0], 'away-win')}
                className="flex flex-col py-2 h-auto hover:bg-primary/10 hover:border-primary/50"
              >
                <span className="text-xs text-muted-foreground">Away</span>
                <span className="text-sm font-bold text-primary">3.80</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}