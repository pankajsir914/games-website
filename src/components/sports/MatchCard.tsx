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
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm">
      {/* Background Image with better overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 group-hover:opacity-15 transition-opacity duration-300"
        style={{ backgroundImage: `url(${sportBackground})` }}
      />
      
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-foreground leading-tight">{match.league}</CardTitle>
              <Badge 
                variant={getStatusColor(match.status)}
                className="text-xs font-medium px-2 py-1"
              >
                {match.status}
              </Badge>
            </div>
          </div>
          
          {/* Date and venue with better spacing */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {match.date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary/60" />
                <span className="font-medium">
                  {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/60" />
                <span className="font-medium">{match.venue}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enhanced Teams and Scores Section */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">H</span>
                </div>
                <div>
                  <span className="font-bold text-foreground text-lg">{match.teams.home}</span>
                  {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                   match.scores.home > match.scores.away && (
                    <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatScore(match.scores.home)}
                </div>
                {match.overs?.home && (
                  <div className="text-sm text-muted-foreground">
                    {match.overs.home} overs
                  </div>
                )}
                {match.wickets?.home !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {match.wickets.home} wickets
                  </div>
                )}
              </div>
            </div>
            
            {/* VS divider */}
            <div className="flex items-center justify-center">
              <div className="w-full h-px bg-border"></div>
              <span className="px-3 text-xs font-medium text-muted-foreground bg-background">VS</span>
              <div className="w-full h-px bg-border"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-accent-foreground">A</span>
                </div>
                <div>
                  <span className="font-bold text-foreground text-lg">{match.teams.away}</span>
                  {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                   match.scores.away > match.scores.home && (
                    <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatScore(match.scores.away)}
                </div>
                {match.overs?.away && (
                  <div className="text-sm text-muted-foreground">
                    {match.overs.away} overs
                  </div>
                )}
                {match.wickets?.away !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {match.wickets.away} wickets
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Betting Section */}
          {showBetting && (
            <div className="space-y-3">
              {!showOdds ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowOdds(true)}
                  className="w-full bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border-primary/20"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Betting Odds
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Live Betting Odds</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOdds(false)}
                      className="text-xs h-6 px-2"
                    >
                      Hide
                    </Button>
                  </div>
                  {odds.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {odds.slice(0, 4).map((odd) => (
                        <Button
                          key={odd.id}
                          variant="outline"
                          size="sm"
                          onClick={() => onBetSelect?.(odd, odd.bet_type)}
                          className="flex flex-col items-center p-3 h-auto hover:bg-primary/5 hover:border-primary/30"
                        >
                          <span className="text-xs font-medium text-muted-foreground">{odd.bet_type}</span>
                          <span className="text-lg font-bold text-primary">{odd.odds.toFixed(2)}x</span>
                          {odd.team_name && (
                            <span className="text-xs text-muted-foreground truncate w-full text-center">
                              {odd.team_name}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                      No odds available for this match
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="default"
              size="default"
              onClick={handleViewDetails}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Eye className="h-4 w-4 mr-2" />
              Match Details
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}