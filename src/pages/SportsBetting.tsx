import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  Trophy,
  Zap,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  Info,
  Clock,
  Users
} from 'lucide-react';
import { useSportsOdds, type OddsResponse } from '@/hooks/useSportsOdds';
import { MatchListCard } from '@/components/sports/MatchListCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const sportsList = ['football', 'cricket', 'tennis', 'basketball', 'horse-racing'];

const SportsBetting: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchOdds, loading, error } = useSportsOdds();
  
  const [selectedSport, setSelectedSport] = useState('football');
  const [oddsData, setOddsData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    document.title = 'Sports Betting - Betfair Exchange';
    loadOdds(1);
  }, [selectedSport]);

  const loadOdds = async (page: number) => {
    try {
      const response = await fetchOdds(selectedSport, undefined, {
        provider: 'betfair',
        markets: ['h2h'],
        region: 'uk',
        page,
        pageSize: 20
      });
      setOddsData(response.data);
      setCurrentPage(response.pagination?.page || 1);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalMatches(response.pagination?.totalCount || 0);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load odds:', err);
      setOddsData([]);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadOdds(newPage);
    }
  };

  const handleRefresh = () => {
    loadOdds(currentPage);
    toast({
      title: "Matches Refreshed",
      description: "Latest Betfair Exchange matches loaded",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gaming-primary to-gaming-accent bg-clip-text text-transparent">
                Betfair Exchange
              </h1>
              <p className="text-muted-foreground mt-1">
                Trade on live sports with back and lay betting
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sportsList.map(sport => (
                  <SelectItem key={sport} value={sport} className="capitalize">
                    {sport.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh Odds
            </Button>

            <div className="flex-1 flex justify-end items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Markets</p>
                    <p className="text-2xl font-bold">{oddsData.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-gaming-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange</p>
                    <p className="text-lg font-bold">Betfair</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gaming-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Liquidity</p>
                    <p className="text-2xl font-bold">
                      ${(oddsData.reduce((sum, m) => sum + (m.liquidity || 0), 0) / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gaming-gold opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Live Users</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <Users className="h-8 w-8 text-gaming-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-6">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Betfair Exchange</strong> - Trade on back and lay prices with live market liquidity
            </AlertDescription>
          </Alert>
        </div>

        {/* Odds Display */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading odds...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : oddsData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No markets available</p>
                <p className="text-sm text-muted-foreground mt-2">Try selecting a different sport</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {oddsData.map((match, idx) => (
                  <MatchListCard
                    key={match.id || idx}
                    matchId={match.id || `match-${idx}`}
                    homeTeam={match.home_team || 'Home Team'}
                    awayTeam={match.away_team || 'Away Team'}
                    sport={selectedSport}
                    matchTime={match.commence_time || new Date().toISOString()}
                    liquidity={match.liquidity || 0}
                    oddsCount={match.bookmakers?.length || 1}
                    featured={idx === 0}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalMatches)} of {totalMatches} matches
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SportsBetting;