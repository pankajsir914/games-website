import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3,
  Target,
  Timer,
  TrendingUp
} from 'lucide-react';
import { useSportsData, SportsMatch } from '@/hooks/useSportsData';

export default function MatchDetails() {
  const { sport, matchId } = useParams();
  const navigate = useNavigate();
  
  // Fetch match data from all categories to find the specific match
  const { data: liveData } = useSportsData(sport || 'cricket', 'live');
  const { data: upcomingData } = useSportsData(sport || 'cricket', 'upcoming'); 
  const { data: resultsData } = useSportsData(sport || 'cricket', 'results');
  
  const [match, setMatch] = useState<SportsMatch | null>(null);

  useEffect(() => {
    // Find the match from all data sources
    const allMatches = [...(liveData || []), ...(upcomingData || []), ...(resultsData || [])];
    const foundMatch = allMatches.find(m => m.id === matchId);
    setMatch(foundMatch || null);
  }, [matchId, liveData, upcomingData, resultsData]);

  useEffect(() => {
    document.title = match ? `${match.teams.home} vs ${match.teams.away} - Match Details` : 'Match Details';
  }, [match]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('in progress')) return 'destructive';
    if (statusLower.includes('completed') || statusLower.includes('finished') || statusLower.includes('won')) return 'secondary';
    return 'default';
  };

  const formatScore = (score: number | null) => {
    return score !== null ? score.toString() : '-';
  };

  const isLive = match?.status.toLowerCase().includes('live') || match?.status.toLowerCase().includes('in progress');
  const isCompleted = match?.status.toLowerCase().includes('completed') || match?.status.toLowerCase().includes('won');

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/sports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sports
            </Button>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Match not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/sports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sports
            </Button>
            <h1 className="text-2xl font-bold">Match Details</h1>
          </div>
          <Button 
            onClick={() => navigate(`/sports/bet/${sport}/${matchId}`)}
            disabled={isCompleted}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Target className="h-4 w-4 mr-2" />
            Place Bet
          </Button>
        </div>

        <div className="space-y-6">
          {/* Match Header */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    {match.league}
                    {isLive && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full">
                        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                        <span className="text-sm font-medium">LIVE</span>
                      </div>
                    )}
                  </CardTitle>
                  <Badge variant={getStatusColor(match.status)} className="mt-2">
                    {match.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Match Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Match Information</h3>
                  <div className="space-y-3">
                    {match.date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{new Date(match.date).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )}
                    {match.venue && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Venue</div>
                          <div className="text-sm text-muted-foreground">{match.venue}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Format</div>
                        <div className="text-sm text-muted-foreground capitalize">{match.sport}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Score */}
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-lg mb-4">Current Score</h3>
                  <div className="bg-muted/30 rounded-xl p-6">
                    <div className="space-y-6">
                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-lg text-primary">H</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-xl">{match.teams.home}</h3>
                            {match.overs?.home && (
                              <p className="text-sm text-muted-foreground">{match.overs.home} overs</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-primary">
                            {formatScore(match.scores.home)}
                          </div>
                          {match.wickets?.home !== undefined && (
                            <div className="text-sm text-muted-foreground">{match.wickets.home} wickets</div>
                          )}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center justify-center py-2">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="mx-4 text-lg font-medium text-muted-foreground">VS</span>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-lg text-accent-foreground">A</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-xl">{match.teams.away}</h3>
                            {match.overs?.away && (
                              <p className="text-sm text-muted-foreground">{match.overs.away} overs</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-primary">
                            {formatScore(match.scores.away)}
                          </div>
                          {match.wickets?.away !== undefined && (
                            <div className="text-sm text-muted-foreground">{match.wickets.away} wickets</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="commentary">Commentary</TabsTrigger>
              <TabsTrigger value="history">H2H</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Team Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{match.teams.home}</span>
                          <span className="text-sm text-muted-foreground">Form: W-W-L-W-W</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{match.teams.away}</span>
                          <span className="text-sm text-muted-foreground">Form: L-W-W-L-W</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-accent h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Match Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">Match Started</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {match.date ? new Date(match.date).toLocaleTimeString() : 'TBD'}
                        </span>
                      </div>
                      {isLive && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                          <span className="text-sm text-destructive">Live Now</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Match Completed</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {match.scores.home || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Runs</div>
                      <div className="text-xs text-muted-foreground">{match.teams.home}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {match.scores.away || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Runs</div>
                      <div className="text-xs text-muted-foreground">{match.teams.away}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {match.overs?.home || '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">Overs</div>
                      <div className="text-xs text-muted-foreground">{match.teams.home}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {match.overs?.away || '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">Overs</div>
                      <div className="text-xs text-muted-foreground">{match.teams.away}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commentary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Commentary</CardTitle>
                </CardHeader>
                <CardContent>
                  {match.commentary && match.commentary.length > 0 ? (
                    <div className="space-y-3">
                      {match.commentary.map((comment, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <p className="text-sm">{comment}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>No commentary available for this match</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Head to Head</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Historical data will be available soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}