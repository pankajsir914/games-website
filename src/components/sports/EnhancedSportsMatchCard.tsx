import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Activity,
  Users,
  Star,
  Share2,
  ChevronRight,
  Timer,
  Zap,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedSportsMatchCardProps {
  match: any;
  sport: string;
  isLive?: boolean;
  showOdds?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const EnhancedSportsMatchCard: React.FC<EnhancedSportsMatchCardProps> = ({ 
  match, 
  sport, 
  isLive, 
  showOdds = true,
  variant = 'default' 
}) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    const matchId = match.eventId || match.id;
    navigate(`/sports/bet/${sport}/${matchId}`, {
      state: { match, sport }
    });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement share functionality
  };

  const formatScore = (score: string | null) => {
    if (!score) return null;
    const parts = score.split('-');
    return { home: parts[0], away: parts[1] };
  };

  const scores = formatScore(match.score);

  // Get random odds for demo (replace with real odds data)
  const getRandomOdds = () => ({
    home: (Math.random() * 3 + 1.5).toFixed(2),
    draw: (Math.random() * 2 + 2.5).toFixed(2),
    away: (Math.random() * 3 + 1.5).toFixed(2)
  });

  const odds = getRandomOdds();

  if (variant === 'compact') {
    return (
      <Card 
        onClick={handleClick}
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-xl hover:scale-[1.02] hover:border-primary/50",
          "bg-gradient-to-br from-card via-card to-card/95",
          isLive && "border-destructive/50 animate-pulse-slow"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <span className="mr-1">●</span> LIVE
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {match.league || sport.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{match.team1}</span>
              {scores && <span className="font-bold text-primary">{scores.home}</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{match.team2}</span>
              {scores && <span className="font-bold text-primary">{scores.away}</span>}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-500 group",
        "hover:shadow-2xl hover:scale-[1.02] hover:border-primary/30",
        "bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-sm",
        isLive && "border-destructive/30 bg-gradient-to-br from-destructive/5 via-card to-card"
      )}
    >
      {/* Header Section */}
      <div className={cn(
        "relative px-4 py-3 border-b border-border/50",
        "bg-gradient-to-r from-primary/5 to-accent/5",
        isLive && "bg-gradient-to-r from-destructive/10 to-orange-500/10"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary opacity-60" />
            <span className="text-xs font-medium text-muted-foreground">
              {match.league || sport.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive ? (
              <Badge variant="destructive" className="animate-pulse text-xs">
                <Activity className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {match.status || 'UPCOMING'}
              </Badge>
            )}
          </div>
        </div>

        {/* Animated background effect for live matches */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-orange-500/20 animate-pulse opacity-50" />
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Teams Section */}
        <div className="space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between group/team">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10",
                "flex items-center justify-center font-bold text-sm",
                "group-hover/team:scale-110 transition-transform"
              )}>
                {match.team1.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground group-hover/team:text-primary transition-colors">
                  {match.team1}
                </p>
                {match.team1Form && (
                  <p className="text-xs text-muted-foreground">Form: {match.team1Form}</p>
                )}
              </div>
            </div>
            {scores && (
              <div className="text-2xl font-bold text-primary animate-fade-in">
                {scores.home}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center relative">
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="bg-card px-3 py-1 text-xs text-muted-foreground font-medium relative">
              VS
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between group/team">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10",
                "flex items-center justify-center font-bold text-sm",
                "group-hover/team:scale-110 transition-transform"
              )}>
                {match.team2.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground group-hover/team:text-primary transition-colors">
                  {match.team2}
                </p>
                {match.team2Form && (
                  <p className="text-xs text-muted-foreground">Form: {match.team2Form}</p>
                )}
              </div>
            </div>
            {scores && (
              <div className="text-2xl font-bold text-primary animate-fade-in">
                {scores.away}
              </div>
            )}
          </div>
        </div>

        {/* Odds Section */}
        {showOdds && !isLive && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Betting Odds</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto py-1.5 px-2 flex flex-col",
                  "hover:bg-primary/10 hover:border-primary/50 transition-all",
                  "group/odds"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground">Home</span>
                <span className="font-bold text-primary group-hover/odds:scale-110 transition-transform">
                  {odds.home}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto py-1.5 px-2 flex flex-col",
                  "hover:bg-primary/10 hover:border-primary/50 transition-all",
                  "group/odds"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground">Draw</span>
                <span className="font-bold text-primary group-hover/odds:scale-110 transition-transform">
                  {odds.draw}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto py-1.5 px-2 flex flex-col",
                  "hover:bg-primary/10 hover:border-primary/50 transition-all",
                  "group/odds"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground">Away</span>
                <span className="font-bold text-primary group-hover/odds:scale-110 transition-transform">
                  {odds.away}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className={cn(
          "flex items-center justify-between text-xs pt-2 border-t border-border/30",
          isLive ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          <div className="flex items-center gap-3 flex-wrap">
            {!isLive && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(match.date).toLocaleDateString()}</span>
              </div>
            )}
            {match.time && !isLive && (
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>{match.time}</span>
              </div>
            )}
            {match.venue && (
              <div className={cn(
                "flex items-center gap-1",
                isLive && "bg-primary/10 px-2 py-1 rounded"
              )}>
                <MapPin className={cn("h-3 w-3", isLive && "text-primary")} />
                <span className="truncate max-w-[150px]">{match.venue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                isFavorite && "text-yellow-500"
              )}
              onClick={handleFavorite}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="default"
            size="sm"
            className={cn(
              "group/btn",
              isLive && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {isLive ? 'Bet Now' : 'View Match'}
            <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Live Match Stats */}
        {isLive && match.stats && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Possession</p>
              <p className="text-xs font-bold">{match.stats.possession || '50%'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Shots</p>
              <p className="text-xs font-bold">{match.stats.shots || '0'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Corners</p>
              <p className="text-xs font-bold">{match.stats.corners || '0'}</p>
            </div>
          </div>
        )}

        {/* Hover Effect Indicator */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent",
          "transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        )} />
      </CardContent>
    </Card>
  );
};

// Loading Skeleton
export const EnhancedSportsMatchCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="px-4 py-3 border-b border-border/50">
      <Skeleton className="h-4 w-24" />
    </div>
    <CardContent className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);