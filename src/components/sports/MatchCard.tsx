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
    navigate(`/sports/match/${match.sport}/${match.id}`);
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 group border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] ${isLandscape ? 'h-56' : ''}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 group-hover:opacity-8 transition-opacity duration-500"
        style={{ backgroundImage: `url(${sportBackground})` }}
      />
      
      {/* Animated Border Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="absolute inset-[1px] bg-card rounded-lg" />
      
      {/* Content */}
      <div className="relative z-10 h-full animate-fade-in">
        {isLandscape ? (
          // Enhanced Landscape Layout
          <div className="flex h-full">
            {/* Left Section - Match Info */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
                      {match.league}
                    </CardTitle>
                    <Badge 
                      variant={getStatusColor(match.status)}
                      className="text-xs font-semibold px-3 py-1 shadow-sm animate-scale-in"
                    >
                      {match.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Date and venue - Enhanced */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  {match.date && (
                    <div className="flex items-center gap-2 hover-scale">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium">
                        {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {match.venue && (
                    <div className="flex items-center gap-2 hover-scale">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-accent-foreground" />
                      </div>
                      <span className="font-medium truncate">{match.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="default"
                size="sm"
                onClick={handleViewDetails}
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/60 shadow-md hover:shadow-lg transition-all duration-300 hover-scale"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>

            {/* Center Section - Enhanced Teams and Scores */}
            <div className="flex-[1.2] p-5 flex flex-col justify-center">
              <div className="space-y-4">
                {/* Home Team */}
                <div className="flex items-center justify-between group/team">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-sm group-hover/team:shadow-md transition-shadow duration-300">
                        <span className="text-xs font-bold text-primary">H</span>
                      </div>
                      {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                       match.scores.home > match.scores.away && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-scale-in">
                          <Trophy className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm group-hover/team:text-primary transition-colors duration-300">
                        {match.teams.home}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary group-hover/team:scale-110 transition-transform duration-300">
                      {formatScore(match.scores.home)}
                    </div>
                    {match.overs?.home && (
                      <div className="text-xs text-muted-foreground font-medium">
                        {match.overs.home} overs
                      </div>
                    )}
                    {match.wickets?.home !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {match.wickets.home}w
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced VS Divider */}
                <div className="flex items-center justify-center my-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <div className="mx-3 px-3 py-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full">
                    <span className="text-xs font-bold text-muted-foreground">VS</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                
                {/* Away Team */}
                <div className="flex items-center justify-between group/team">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center shadow-sm group-hover/team:shadow-md transition-shadow duration-300">
                        <span className="text-xs font-bold text-accent-foreground">A</span>
                      </div>
                      {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                       match.scores.away > match.scores.home && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-scale-in">
                          <Trophy className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm group-hover/team:text-accent-foreground transition-colors duration-300">
                        {match.teams.away}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary group-hover/team:scale-110 transition-transform duration-300">
                      {formatScore(match.scores.away)}
                    </div>
                    {match.overs?.away && (
                      <div className="text-xs text-muted-foreground font-medium">
                        {match.overs.away} overs
                      </div>
                    )}
                    {match.wickets?.away !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {match.wickets.away}w
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Enhanced Betting */}
            {showBetting && (
              <div className="w-48 p-4 border-l border-border/30 bg-gradient-to-b from-muted/20 to-muted/10">
                {!showOdds ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOdds(true)}
                    className="w-full bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/15 hover:to-accent/15 border-primary/30 hover:border-primary/50 transition-all duration-300 hover-scale"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Odds
                  </Button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Live Odds</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOdds(false)}
                        className="text-xs h-5 px-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                      >
                        ×
                      </Button>
                    </div>
                    {odds.length > 0 ? (
                      <div className="space-y-2">
                        {odds.slice(0, 3).map((odd, index) => (
                          <Button
                            key={odd.id}
                            variant="outline"
                            size="sm"
                            onClick={() => onBetSelect?.(odd, odd.bet_type)}
                            className="w-full p-2 h-auto hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 hover-scale"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-xs font-medium">{odd.bet_type}</span>
                              <span className="font-bold text-primary text-sm">{odd.odds.toFixed(1)}x</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-muted-foreground bg-muted/20 rounded-md">
                        No odds available
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Enhanced Portrait Layout
          <>
            <CardHeader className="pb-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
                    {match.league}
                  </CardTitle>
                  <Badge 
                    variant={getStatusColor(match.status)}
                    className="text-xs font-semibold px-3 py-1 shadow-sm animate-scale-in"
                  >
                    {match.status}
                  </Badge>
                </div>
              </div>
              
              {/* Enhanced Date and venue */}
              <div className="space-y-3 text-sm text-muted-foreground">
                {match.date && (
                  <div className="flex items-center gap-3 hover-scale">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">
                      {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-3 hover-scale">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="font-medium">{match.venue}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Enhanced Teams and Scores Section */}
              <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 space-y-5 shadow-inner">
                {/* Home Team */}
                <div className="flex items-center justify-between group/team">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-md group-hover/team:shadow-lg transition-shadow duration-300">
                        <span className="text-sm font-bold text-primary">H</span>
                      </div>
                      {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                       match.scores.home > match.scores.away && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center animate-scale-in shadow-md">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-lg group-hover/team:text-primary transition-colors duration-300">
                        {match.teams.home}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary mb-1 group-hover/team:scale-110 transition-transform duration-300">
                      {formatScore(match.scores.home)}
                    </div>
                    {match.overs?.home && (
                      <div className="text-sm text-muted-foreground font-medium">
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
                
                {/* Enhanced VS divider */}
                <div className="flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <div className="mx-4 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full shadow-sm">
                    <span className="text-sm font-bold text-muted-foreground">VS</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                
                {/* Away Team */}
                <div className="flex items-center justify-between group/team">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center shadow-md group-hover/team:shadow-lg transition-shadow duration-300">
                        <span className="text-sm font-bold text-accent-foreground">A</span>
                      </div>
                      {match.status.toLowerCase().includes('won') && match.scores.home && match.scores.away && 
                       match.scores.away > match.scores.home && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center animate-scale-in shadow-md">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-lg group-hover/team:text-accent-foreground transition-colors duration-300">
                        {match.teams.away}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary mb-1 group-hover/team:scale-110 transition-transform duration-300">
                      {formatScore(match.scores.away)}
                    </div>
                    {match.overs?.away && (
                      <div className="text-sm text-muted-foreground font-medium">
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
                <div className="space-y-4">
                  {!showOdds ? (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setShowOdds(true)}
                      className="w-full bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/15 hover:to-accent/15 border-primary/30 hover:border-primary/50 transition-all duration-300 hover-scale py-3"
                    >
                      <TrendingUp className="h-5 w-5 mr-2" />
                      View Betting Odds
                    </Button>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Live Betting Odds</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOdds(false)}
                          className="text-xs h-6 px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        >
                          Hide
                        </Button>
                      </div>
                      {odds.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {odds.slice(0, 4).map((odd, index) => (
                            <Button
                              key={odd.id}
                              variant="outline"
                              size="sm"
                              onClick={() => onBetSelect?.(odd, odd.bet_type)}
                              className="flex flex-col items-center p-4 h-auto hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 hover-scale animate-fade-in"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <span className="text-xs font-medium text-muted-foreground mb-1">{odd.bet_type}</span>
                              <span className="text-xl font-bold text-primary">{odd.odds.toFixed(2)}x</span>
                              {odd.team_name && (
                                <span className="text-xs text-muted-foreground truncate w-full text-center mt-1">
                                  {odd.team_name}
                                </span>
                              )}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
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
                  className="flex-1 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/60 shadow-md hover:shadow-lg transition-all duration-300 hover-scale py-3"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Match Details
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </div>
    </Card>
  );
}