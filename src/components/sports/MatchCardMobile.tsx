import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, TrendingUp, Eye, Trophy, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MatchCardMobileProps {
  match: any;
  sport: string;
  isLive?: boolean;
  isCompleted?: boolean;
}

export const MatchCardMobile: React.FC<MatchCardMobileProps> = ({ 
  match, 
  sport, 
  isLive = false,
  isCompleted = false 
}) => {
  const navigate = useNavigate();

  const getStatusColor = () => {
    if (isLive) return 'destructive';
    if (isCompleted) return 'secondary';
    return 'default';
  };

  const formatScore = (score: any) => {
    return score !== null && score !== undefined ? score.toString() : '-';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10",
        isLive && "border-destructive/50 bg-gradient-to-r from-destructive/5 to-transparent"
      )}>
        {/* Header */}
        <div className={cn(
          "px-4 py-3 border-b",
          isLive ? "bg-gradient-to-r from-destructive/10 to-transparent" : "bg-card"
        )}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor()} className="text-xs">
                  {isLive && <Activity className="h-3 w-3 mr-1 animate-pulse" />}
                  {match.status || (isLive ? 'LIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING')}
                </Badge>
                {match.league && (
                  <span className="text-xs text-muted-foreground">{match.league}</span>
                )}
              </div>
            </div>
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-xs text-destructive font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Teams and Scores */}
          <div className="space-y-3">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">H</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{match.teams?.home || match.homeTeam}</p>
                  {match.overs?.home && (
                    <p className="text-xs text-muted-foreground">{match.overs.home} ov</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-2xl font-bold",
                  isLive && "text-primary animate-pulse"
                )}>
                  {formatScore(match.scores?.home || match.homeScore)}
                </p>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">A</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{match.teams?.away || match.awayTeam}</p>
                  {match.overs?.away && (
                    <p className="text-xs text-muted-foreground">{match.overs.away} ov</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-2xl font-bold",
                  isLive && "text-primary animate-pulse"
                )}>
                  {formatScore(match.scores?.away || match.awayScore)}
                </p>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
            {match.date && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(match.date).toLocaleDateString()} • {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {!isCompleted && (
              <Button
                size="sm"
                variant={isLive ? "default" : "outline"}
                onClick={() => navigate(`/sports/bet/${sport}/${match.id}`)}
                className={cn(
                  "w-full",
                  isLive && "bg-gradient-to-r from-primary to-primary/80"
                )}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {isLive ? 'Bet Live' : 'Bet'}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/match-details/${sport}/${match.id}`)}
              className={cn(
                "w-full",
                isCompleted && "col-span-2"
              )}
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};