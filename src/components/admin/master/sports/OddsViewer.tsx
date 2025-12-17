import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useToast } from '@/hooks/use-toast';

interface OddsViewerProps {
  matches: any[];
}

export const OddsViewer = ({ matches }: OddsViewerProps) => {
  const { toast } = useToast();
  const { getOdds, loading } = useDiamondSportsAPI();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [oddsData, setOddsData] = useState<any>(null);

  const fetchOdds = async (match: any) => {
    const eventId = match.eventId || match.id;
    if (!eventId) {
      toast({
        title: "Error",
        description: "No event ID found for this match",
        variant: "destructive"
      });
      return;
    }

    const response = await getOdds(eventId);
    if (response?.data) {
      setOddsData(response.data);
      setSelectedMatch(match);
    }
  };

  const getOddsTrend = (current: number, previous: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-gray-400" />;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Match Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Match for Odds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.map((match, idx) => (
              <Button
                key={match.id || idx}
                variant={selectedMatch?.id === match.id ? "default" : "outline"}
                className="justify-start"
                onClick={() => fetchOdds(match)}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {match.homeTeam || match.team1} vs {match.awayTeam || match.team2}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {match.sport} • {match.status}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Odds Display */}
      {selectedMatch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Odds & Markets</span>
              <Button size="sm" variant="outline" onClick={() => fetchOdds(selectedMatch)}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
            </div>
          </CardHeader>
          <CardContent>
            {oddsData ? (
              <div className="space-y-4">
                {/* Main Odds */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Home Win</div>
                        <div className="text-2xl font-bold">{oddsData.homeOdds || '2.10'}</div>
                        {getOddsTrend(oddsData.homeOdds, oddsData.previousHomeOdds)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Draw</div>
                        <div className="text-2xl font-bold">{oddsData.drawOdds || '3.50'}</div>
                        {getOddsTrend(oddsData.drawOdds, oddsData.previousDrawOdds)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Away Win</div>
                        <div className="text-2xl font-bold">{oddsData.awayOdds || '2.90'}</div>
                        {getOddsTrend(oddsData.awayOdds, oddsData.previousAwayOdds)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Markets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Markets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Market</TableHead>
                          <TableHead>Selection</TableHead>
                          <TableHead className="text-right">Odds</TableHead>
                          <TableHead className="text-right">Trend</TableHead>
                          <TableHead className="text-right">Liquidity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Over/Under 2.5</TableCell>
                          <TableCell>Over</TableCell>
                          <TableCell className="text-right">1.85</TableCell>
                          <TableCell className="text-right">
                            <TrendingUp className="h-4 w-4 text-green-500 inline" />
                          </TableCell>
                          <TableCell className="text-right">₹50,000</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Over/Under 2.5</TableCell>
                          <TableCell>Under</TableCell>
                          <TableCell className="text-right">2.05</TableCell>
                          <TableCell className="text-right">
                            <TrendingDown className="h-4 w-4 text-red-500 inline" />
                          </TableCell>
                          <TableCell className="text-right">₹45,000</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Both Teams to Score</TableCell>
                          <TableCell>Yes</TableCell>
                          <TableCell className="text-right">1.75</TableCell>
                          <TableCell className="text-right">
                            <Minus className="h-4 w-4 text-gray-400 inline" />
                          </TableCell>
                          <TableCell className="text-right">₹30,000</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Both Teams to Score</TableCell>
                          <TableCell>No</TableCell>
                          <TableCell className="text-right">2.20</TableCell>
                          <TableCell className="text-right">
                            <Minus className="h-4 w-4 text-gray-400 inline" />
                          </TableCell>
                          <TableCell className="text-right">₹25,000</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Loading odds...' : 'Select a match to view odds'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};