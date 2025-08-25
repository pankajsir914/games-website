import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Trophy, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SportsMatch } from '@/hooks/useSportsData';
import { useSportsOdds, BettingOdds } from '@/hooks/useSportsOdds';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedMatchCardProps {
  match: SportsMatch;
  sport: string;
  showBetting?: boolean;
  showOdds?: boolean;
}

export const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({ 
  match, 
  sport,
  showBetting = true,
  showOdds = true 
}) => {
  const navigate = useNavigate();
  const { fetchOdds } = useSportsOdds();
  const [odds, setOdds] = useState<BettingOdds | null>(null);
  const [loadingOdds, setLoadingOdds] = useState(false);

  useEffect(() => {
    if (showOdds && match.id && showBetting) {
      setLoadingOdds(true);
      fetchOdds(sport, match.id)
        .then(oddsData => {
          if (oddsData && oddsData.length > 0) {
            setOdds(oddsData[0]);
          }
        })
        .catch(err => console.error('Failed to fetch odds:', err))
        .finally(() => setLoadingOdds(false));
    }
  }, [match.id, sport, showOdds, showBetting]);

  const isLive = match.status?.toLowerCase().includes('live') || 
                 match.status?.toLowerCase().includes('in progress');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('in progress')) {
      return 'bg-red-500 text-white animate-pulse';
    }
    if (statusLower.includes('finished') || statusLower.includes('completed')) {
      return 'bg-gray-500 text-white';
    }
    return 'bg-blue-500 text-white';
  };

  const getTopOdds = () => {
    if (!odds || !odds.odds?.h2h || odds.odds.h2h.length === 0) return null;
    
    // Get the first bookmaker's odds
    const firstBookmaker = odds.odds.h2h[0];
    return {
      bookmaker: firstBookmaker.bookmaker,
      home: firstBookmaker.home,
      away: firstBookmaker.away,
      draw: firstBookmaker.draw,
    };
  };

  const topOdds = getTopOdds();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/95 backdrop-blur">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">
              {match.league || sport.toUpperCase()}
            </span>
          </div>
          <Badge className={getStatusColor(match.status)}>
            {isLive && <span className="mr-1">🔴</span>}
            {match.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Teams Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{match.teams.home}</span>
              </div>
            </div>
            {match.scores.home !== null && (
              <span className="text-2xl font-bold text-primary">
                {match.scores.home}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-center">
            <span className="text-muted-foreground text-sm">VS</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{match.teams.away}</span>
              </div>
            </div>
            {match.scores.away !== null && (
              <span className="text-2xl font-bold text-primary">
                {match.scores.away}
              </span>
            )}
          </div>
        </div>

        {/* Odds Section */}
        {showOdds && showBetting && (
          <div className="border-t border-border/30 pt-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              BETTING ODDS
            </div>
            {loadingOdds ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : topOdds ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-secondary/50 rounded">
                  <div className="text-xs text-muted-foreground">Home</div>
                  <div className="font-bold text-primary">{topOdds.home}</div>
                </div>
                {topOdds.draw && (
                  <div className="text-center p-2 bg-secondary/50 rounded">
                    <div className="text-xs text-muted-foreground">Draw</div>
                    <div className="font-bold text-primary">{topOdds.draw}</div>
                  </div>
                )}
                <div className="text-center p-2 bg-secondary/50 rounded">
                  <div className="text-xs text-muted-foreground">Away</div>
                  <div className="font-bold text-primary">{topOdds.away}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                {odds?.mock ? 'Sample odds' : 'Odds not available'}
              </div>
            )}
          </div>
        )}

        {/* Match Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/30 pt-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(match.date)}
          </div>
          {match.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{match.venue}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showBetting && (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/sports/bet/${sport}/${match.id}`)}
            >
              Place Bet
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/match-details/${sport}/${match.id}`)}
            >
              Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};