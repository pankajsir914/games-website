import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Activity,
  Timer,
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const ensureAuthenticated = (onSuccess: () => void) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to view match details and odds.',
      });
      setAuthModalOpen(true);
      return;
    }
    onSuccess();
  };

  const handleClick = () => {
    const matchId = match.eventId || match.id;
    ensureAuthenticated(() => {
      navigate(`/sports/bet/${sport}/${matchId}`, {
        state: { match, sport }
      });
    });
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

  const cardContent = variant === 'compact' ? (
    <Card 
      onClick={handleClick}
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-300 active:scale-95",
        "hover:shadow-xl hover:scale-[1.02] hover:border-primary/50",
        "bg-gradient-to-br from-card via-card to-card/95",
        isLive && "border-destructive/50 animate-pulse-slow"
      )}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs px-1.5 sm:px-2">
              <span className="mr-1">●</span> LIVE
            </Badge>
          )}
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate ml-2">
          {match.cname || match.league || sport.toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center gap-2">
            <span className="font-medium text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">{match.team1}</span>
            {scores && <span className="font-bold text-primary text-lg sm:text-xl shrink-0">{scores.home}</span>}
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="font-medium text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">{match.team2}</span>
            {scores && <span className="font-bold text-primary text-lg sm:text-xl shrink-0">{scores.away}</span>}
          </div>
        </div>
      </div>
    </Card>
  ) : (
    <Card 
      onClick={handleClick}
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-500 group",
        "hover:shadow-2xl hover:scale-[1.02] hover:border-primary/30",
        "bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-sm",
        isLive && "border-destructive/30 bg-gradient-to-br from-destructive/5 via-card to-card"
      )}
    >
      {/* Header Section */}
      <div className={cn(
        "relative px-3 sm:px-4 py-2 sm:py-3 border-b border-border/50",
        "bg-gradient-to-r from-primary/5 to-accent/5",
        isLive && "bg-gradient-to-r from-destructive/10 to-orange-500/10"
      )}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary opacity-60 shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {match.cname || match.league || sport.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isLive ? (
              <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs px-1.5 sm:px-2">
                <Activity className="h-3 w-3 mr-0.5 sm:mr-1" />
                LIVE
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                <Clock className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">{match.status || 'UPCOMING'}</span>
                <span className="sm:hidden">UP</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Animated background effect for live matches */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-orange-500/20 animate-pulse opacity-50" />
        )}
      </div>

      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Teams Section */}
        <div className="space-y-2 sm:space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between group/team gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shrink-0",
                "flex items-center justify-center font-bold text-xs sm:text-sm",
                "group-hover/team:scale-110 transition-transform"
              )}>
                {match.team1.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-foreground group-hover/team:text-primary transition-colors truncate">
                  {match.team1}
                </p>
                {match.team1Form && (
                  <p className="text-xs text-muted-foreground">Form: {match.team1Form}</p>
                )}
              </div>
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold shrink-0",
              scores ? "text-primary animate-fade-in" : "text-muted-foreground/20"
            )}>
              {scores ? scores.home : "0"}
            </div>
          </div>

          {/* VS Divider with Score Separator */}
          <div className="flex items-center justify-center relative">
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="bg-card px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-muted-foreground font-medium relative">
              {scores ? `${scores.home} - ${scores.away}` : "VS"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between group/team gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 shrink-0",
                "flex items-center justify-center font-bold text-xs sm:text-sm",
                "group-hover/team:scale-110 transition-transform"
              )}>
                {match.team2.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-foreground group-hover/team:text-primary transition-colors truncate">
                  {match.team2}
                </p>
                {match.team2Form && (
                  <p className="text-xs text-muted-foreground">Form: {match.team2Form}</p>
                )}
              </div>
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold shrink-0",
              scores ? "text-primary animate-fade-in" : "text-muted-foreground/20"
            )}>
              {scores ? scores.away : "0"}
            </div>
          </div>
        </div>


        {/* Match Info */}
        <div className={cn(
          "flex items-center justify-between text-[10px] sm:text-xs pt-2 border-t border-border/30",
          isLive ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isLive && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{new Date(match.date).toLocaleDateString()}</span>
              </div>
            )}
            {match.time && !isLive && (
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3 shrink-0" />
                <span>{match.time}</span>
              </div>
            )}
            {match.venue && (
              <div className={cn(
                "flex items-center gap-1 min-w-0",
                isLive && "bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded"
              )}>
                <MapPin className={cn("h-3 w-3 shrink-0", isLive && "text-primary")} />
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{match.venue}</span>
              </div>
            )}
          </div>
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

  return (
    <>
      {cardContent}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
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
