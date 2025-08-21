import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, DollarSign, Clock, MapPin, Trophy, Users } from 'lucide-react';
import { useSportsData, SportsMatch } from '@/hooks/useSportsData';
import { useBettingOdds, useMockBetting } from '@/hooks/useSportsBetting';
import { useToast } from '@/hooks/use-toast';

export default function SportsBet() {
  const { sport, matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch match data from all categories to find the specific match
  const { data: liveData } = useSportsData(sport || 'cricket', 'live');
  const { data: upcomingData } = useSportsData(sport || 'cricket', 'upcoming'); 
  const { data: resultsData } = useSportsData(sport || 'cricket', 'results');
  
  const [match, setMatch] = useState<SportsMatch | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState<{ type: string; odds: number; team?: string } | null>(null);
  
  const { odds } = useBettingOdds(sport || 'cricket', matchId || '');
  const { placeMockBet, loading: bettingLoading } = useMockBetting();

  useEffect(() => {
    // Find the match from all data sources
    const allMatches = [...(liveData || []), ...(upcomingData || []), ...(resultsData || [])];
    const foundMatch = allMatches.find(m => m.id === matchId);
    setMatch(foundMatch || null);
  }, [matchId, liveData, upcomingData, resultsData]);

  useEffect(() => {
    document.title = match ? `Bet on ${match.teams.home} vs ${match.teams.away}` : 'Sports Betting';
  }, [match]);

  const handlePlaceBet = async () => {
    if (!selectedBet || !betAmount || !match) {
      toast({
        title: "Invalid Bet",
        description: "Please select bet type and enter amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await placeMockBet({
        sport_type: match.sport,
        match_id: match.id,
        bet_type: selectedBet.type,
        team_name: selectedBet.team,
        amount: parseFloat(betAmount),
        odds: selectedBet.odds
      });

      toast({
        title: "Bet Placed Successfully!",
        description: `${betAmount} coins bet on ${selectedBet.team || selectedBet.type}`,
      });

      setBetAmount('');
      setSelectedBet(null);
    } catch (error) {
      toast({
        title: "Bet Failed",
        description: "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('in progress')) return 'destructive';
    if (statusLower.includes('completed') || statusLower.includes('finished') || statusLower.includes('won')) return 'secondary';
    return 'default';
  };

  const formatScore = (score: number | null) => {
    return score !== null ? score.toString() : '-';
  };

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

  const isLive = match.status.toLowerCase().includes('live') || match.status.toLowerCase().includes('in progress');
  const isCompleted = match.status.toLowerCase().includes('completed') || match.status.toLowerCase().includes('won');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/sports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sports
          </Button>
          <h1 className="text-2xl font-bold">Sports Betting</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Display Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{match.league}</CardTitle>
                    <Badge variant={getStatusColor(match.status)} className="mt-2">
                      {match.status}
                    </Badge>
                  </div>
                  {isLive && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full">
                      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                  {match.date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(match.date).toLocaleString()}</span>
                    </div>
                  )}
                  {match.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{match.venue}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="bg-muted/30 rounded-xl p-6">
                  {/* Teams and Scores */}
                  <div className="space-y-4">
                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-primary">H</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{match.teams.home}</h3>
                          {match.overs?.home && (
                            <p className="text-sm text-muted-foreground">{match.overs.home} overs</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {formatScore(match.scores.home)}
                        </div>
                        {match.wickets?.home !== undefined && (
                          <div className="text-sm text-muted-foreground">{match.wickets.home}w</div>
                        )}
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center justify-center py-2">
                      <div className="flex-1 h-px bg-border"></div>
                      <span className="mx-4 text-sm font-medium text-muted-foreground">VS</span>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-accent-foreground">A</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{match.teams.away}</h3>
                          {match.overs?.away && (
                            <p className="text-sm text-muted-foreground">{match.overs.away} overs</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {formatScore(match.scores.away)}
                        </div>
                        {match.wickets?.away !== undefined && (
                          <div className="text-sm text-muted-foreground">{match.wickets.away}w</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Betting Odds Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Betting Odds
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCompleted ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Betting is closed for completed matches</p>
                  </div>
                ) : (
                  <Tabs defaultValue="match-winner" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="match-winner">Match Winner</TabsTrigger>
                      <TabsTrigger value="totals">Totals</TabsTrigger>
                      <TabsTrigger value="specials">Specials</TabsTrigger>
                    </TabsList>

                    <TabsContent value="match-winner" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant={selectedBet?.team === match.teams.home ? "default" : "outline"}
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => setSelectedBet({ type: 'match_winner', odds: 1.85, team: match.teams.home })}
                        >
                          <span className="font-medium">{match.teams.home}</span>
                          <span className="text-lg font-bold">1.85x</span>
                        </Button>
                        <Button
                          variant={selectedBet?.team === match.teams.away ? "default" : "outline"}
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => setSelectedBet({ type: 'match_winner', odds: 2.10, team: match.teams.away })}
                        >
                          <span className="font-medium">{match.teams.away}</span>
                          <span className="text-lg font-bold">2.10x</span>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="totals" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant={selectedBet?.type === 'over_150' ? "default" : "outline"}
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => setSelectedBet({ type: 'over_150', odds: 1.90 })}
                        >
                          <span className="font-medium">Over 150 Runs</span>
                          <span className="text-lg font-bold">1.90x</span>
                        </Button>
                        <Button
                          variant={selectedBet?.type === 'under_150' ? "default" : "outline"}
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => setSelectedBet({ type: 'under_150', odds: 1.95 })}
                        >
                          <span className="font-medium">Under 150 Runs</span>
                          <span className="text-lg font-bold">1.95x</span>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="specials" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          variant={selectedBet?.type === 'man_of_match' ? "default" : "outline"}
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => setSelectedBet({ type: 'man_of_match', odds: 3.50 })}
                        >
                          <span className="font-medium">Man of the Match</span>
                          <span className="text-lg font-bold">3.50x</span>
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bet Slip Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Bet Slip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBet ? (
                  <>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="font-medium">
                        {selectedBet.team ? `${selectedBet.team} to Win` : selectedBet.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Odds: {selectedBet.odds}x
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="betAmount">Bet Amount (Coins)</Label>
                      <Input
                        id="betAmount"
                        type="number"
                        placeholder="Enter amount..."
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        min="1"
                      />
                    </div>

                    {betAmount && (
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="text-sm">Potential Payout</div>
                        <div className="text-lg font-bold text-primary">
                          {(parseFloat(betAmount) * selectedBet.odds).toFixed(2)} Coins
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full" 
                      onClick={handlePlaceBet}
                      disabled={!betAmount || bettingLoading || isCompleted}
                    >
                      {bettingLoading ? 'Placing Bet...' : 'Place Bet'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a betting option to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}