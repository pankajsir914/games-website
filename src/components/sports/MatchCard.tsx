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
}

export function MatchCard({ match, sportBackground, onBetSelect, showBetting = true }: MatchCardProps) {
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
    navigate(`/sports/match/${match.sport}/${match.id}`);
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-300"
        style={{ backgroundImage: `url(${sportBackground})` }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">{match.league}</CardTitle>
            <Badge variant={getStatusColor(match.status)}>{match.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {match.date && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(match.date).toLocaleString()}
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {match.venue}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Teams and Scores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{match.teams.home}</span>
                {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                 match.scores.home > match.scores.away && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold bg-primary/20 px-3 py-1 rounded text-primary-foreground">
                  {formatScore(match.scores.home)}
                </span>
                {match.overs?.home && (
                  <span className="text-xs text-muted-foreground">
                    ({match.overs.home})
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{match.teams.away}</span>
                {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                 match.scores.away > match.scores.home && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold bg-primary/20 px-3 py-1 rounded text-primary-foreground">
                  {formatScore(match.scores.away)}
                </span>
                {match.overs?.away && (
                  <span className="text-xs text-muted-foreground">
                    ({match.overs.away})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Betting Section */}
          {showBetting && (
            <div className="space-y-2 pt-2 border-t">
              {!showOdds ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOdds(true)}
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Betting Odds
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Mock Betting Odds</div>
                  {odds.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {odds.slice(0, 4).map((odd) => (
                        <Button
                          key={odd.id}
                          variant="outline"
                          size="sm"
                          onClick={() => onBetSelect?.(odd, odd.bet_type)}
                          className="flex flex-col items-center p-2 h-auto"
                        >
                          <span className="text-xs">{odd.bet_type}</span>
                          <span className="font-bold">{odd.odds.toFixed(2)}x</span>
                          {odd.team_name && (
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {odd.team_name}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No odds available
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOdds(false)}
                    className="w-full text-xs"
                  >
                    Hide Odds
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}