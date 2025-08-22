import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Trophy, TrendingUp, Eye } from 'lucide-react';
import { SportsMatch } from '@/hooks/useSportsData';
import { useBettingOdds } from '@/hooks/useSportsBetting';
import { useNavigate } from 'react-router-dom';

interface MatchCardProps {
  match: SportsMatch;
  sportBackground: string;
  onBetSelect?: (odds: any, type: string) => void;
  showBetting?: boolean;
  isLandscape?: boolean;
}

export function MatchCard({ match, sportBackground, onBetSelect, showBetting = true, isLandscape = false }: MatchCardProps) {
  const navigate = useNavigate();
  const [showOdds, setShowOdds] = useState(false);
  const { odds } = useBettingOdds(match.sport, match.id);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('in progress')) return 'destructive';
    if (statusLower.includes('completed') || statusLower.includes('finished') || statusLower.includes('won')) return 'secondary';
    return 'default';
  };

  const formatScore = (score: number | null) => {
    return score !== null ? score.toString() : '-';
  };

  const handleViewDetails = () => {
    navigate(`/match-details/${match.sport}/${match.id}`);
  };

  return (
    <Card className="bg-card border border-border hover:border-primary/20 transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground mb-2">
              {match.league}
            </CardTitle>
            <Badge variant={getStatusColor(match.status)} className="text-xs">
              {match.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {match.date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(match.date).toLocaleDateString()} • {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{match.venue}</span>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">H</span>
              </div>
              <span className="font-medium text-foreground">{match.teams.home}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                {formatScore(match.scores.home)}
              </div>
              {match.overs?.home && (
                <div className="text-xs text-muted-foreground">
                  {match.overs.home} ov
                </div>
              )}
            </div>
          </div>
          
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">A</span>
              </div>
              <span className="font-medium text-foreground">{match.teams.away}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                {formatScore(match.scores.away)}
              </div>
              {match.overs?.away && (
                <div className="text-xs text-muted-foreground">
                  {match.overs.away} ov
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sports/bet/${match.sport}/${match.id}`)}
            disabled={match.status.toLowerCase().includes('completed') || match.status.toLowerCase().includes('won')}
            className="text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Bet
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewDetails}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>

        {/* Betting Odds (if enabled) */}
        {showBetting && odds.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="space-y-2">
              <span className="text-xs font-medium text-foreground">Odds</span>
              <div className="space-y-1">
                {odds.slice(0, 2).map((odd) => (
                  <Button
                    key={odd.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onBetSelect?.(odd, odd.bet_type)}
                    className="w-full h-auto p-2"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs">{odd.bet_type}</span>
                      <span className="font-medium text-primary">{odd.odds.toFixed(1)}x</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}