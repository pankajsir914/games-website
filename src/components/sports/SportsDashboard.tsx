import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useSportsDataContext } from '@/contexts/SportsDataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { HeroSection } from './HeroSection';
import { SportsFilterBar } from './SportsFilterBar';
import { SportCard } from './SportCard';
import { EnhancedMatchCard } from './EnhancedMatchCard';
import { LiveMatchTicker } from './LiveMatchTicker';
import { MatchCardMobile } from './MatchCardMobile';
import { Loader2, Trophy, Activity, Timer, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const sports = ['cricket', 'football', 'basketball', 'tennis', 'hockey', 'kabaddi', 'baseball', 'table-tennis', 'boxing'] as const;
type Sport = typeof sports[number];

interface SportsDashboardProps {
  defaultSport?: Sport;
}

export const SportsDashboard: React.FC<SportsDashboardProps> = ({ defaultSport = 'cricket' }) => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceDetection();
  const [selectedSport, setSelectedSport] = useState<Sport>(defaultSport);
  const [filter, setFilter] = useState<'all' | 'live' | 'today' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const { getMatchData, refreshMatchData, availableSports } = useSportsDataContext();

  // Fetch data for selected sport
  const liveQuery = getMatchData(selectedSport, 'live');
  const upcomingQuery = getMatchData(selectedSport, 'upcoming');
  const resultsQuery = getMatchData(selectedSport, 'results');

  // Calculate stats
  const totalLiveMatches = liveQuery.data?.length || 0;
  const todayMatches = upcomingQuery.data?.filter((match: any) => {
    const matchDate = new Date(match.date);
    const today = new Date();
    return matchDate.toDateString() === today.toDateString();
  }).length || 0;

  const stats = [
    { label: 'Live Now', value: totalLiveMatches, icon: Activity, color: 'text-destructive' },
    { label: 'Today', value: todayMatches, icon: Timer, color: 'text-primary' },
    { label: 'Upcoming', value: upcomingQuery.data?.length || 0, icon: TrendingUp, color: 'text-accent' },
  ];
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshMatchData(selectedSport, 'live'),
        refreshMatchData(selectedSport, 'upcoming'),
        refreshMatchData(selectedSport, 'results')
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      {/* Hero Section */}
      <HeroSection
        sport={selectedSport}
        liveMatches={totalLiveMatches}
        todayMatches={todayMatches}
      />

      {/* Live Match Ticker */}
      {totalLiveMatches > 0 && (
        <LiveMatchTicker matches={liveQuery.data || []} />
      )}


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Bar with Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <SportsFilterBar
              filter={filter}
              onFilterChange={setFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Sports Selection */}
        {isMobile ? (
          <Select value={selectedSport} onValueChange={(value) => setSelectedSport(value as Sport)}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSports.length > 0 ? availableSports.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </SelectItem>
              )) : sports.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <ScrollArea className="w-full mb-6">
            <div className="flex gap-3 pb-2">
              {availableSports.length > 0 ? availableSports.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  onClick={() => setSelectedSport(sport as Sport)}
                  className="flex-shrink-0 capitalize"
                >
                  {sport}
                </Button>
              )) : sports.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  onClick={() => setSelectedSport(sport)}
                  className="flex-shrink-0 capitalize"
                >
                  {sport}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Matches Content */}
        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live
              {totalLiveMatches > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1">
                  {totalLiveMatches}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {liveQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : liveQuery.error ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Failed to load live matches</p>
                <Button onClick={() => liveQuery.refetch()} variant="outline" className="mt-4">
                  Retry
                </Button>
              </Card>
            ) : !liveQuery.data || liveQuery.data.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No live {selectedSport} matches at the moment</p>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {liveQuery.data.map((match: any) => (
                  isMobile ? (
                    <MatchCardMobile
                      key={match.id}
                      match={match}
                      sport={selectedSport}
                    />
                  ) : (
                    <EnhancedMatchCard
                      key={match.id}
                      match={match}
                      sport={selectedSport}
                    />
                  )
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingQuery.error ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Failed to load upcoming matches</p>
                <Button onClick={() => upcomingQuery.refetch()} variant="outline" className="mt-4">
                  Retry
                </Button>
              </Card>
            ) : !upcomingQuery.data || upcomingQuery.data.length === 0 ? (
              <Card className="p-8 text-center">
                <Timer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming {selectedSport} matches scheduled</p>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {upcomingQuery.data
                  .filter((match: any) => {
                    if (filter === 'all') return true;
                    if (filter === 'today') {
                      const matchDate = new Date(match.date);
                      const today = new Date();
                      return matchDate.toDateString() === today.toDateString();
                    }
                    return true;
                  })
                  .map((match: any) => (
                    isMobile ? (
                      <MatchCardMobile
                        key={match.id}
                        match={match}
                        sport={selectedSport}
                      />
                    ) : (
                      <EnhancedMatchCard
                        key={match.id}
                        match={match}
                        sport={selectedSport}
                      />
                    )
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {resultsQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : resultsQuery.error ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Failed to load results</p>
                <Button onClick={() => resultsQuery.refetch()} variant="outline" className="mt-4">
                  Retry
                </Button>
              </Card>
            ) : !resultsQuery.data || resultsQuery.data.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No recent {selectedSport} results available</p>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {resultsQuery.data.map((match: any) => (
                  isMobile ? (
                    <MatchCardMobile
                      key={match.id}
                      match={match}
                      sport={selectedSport}
                    />
                  ) : (
                    <EnhancedMatchCard
                      key={match.id}
                      match={match}
                      sport={selectedSport}
                    />
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};