import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { RefreshCw, Trophy, Clock, AlertCircle, TrendingUp, Zap, Globe, Gamepad2, Grid2x2, List } from 'lucide-react';
import { useSimpleSportsData } from '@/hooks/useSimpleSportsData';
import { cn } from '@/lib/utils';
import { EnhancedSportsMatchCard, EnhancedSportsMatchCardSkeleton } from '@/components/sports/EnhancedSportsMatchCard';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const SimpleSportsDashboard: React.FC = () => {
  const {
    sports,
    selectedSport,
    matches,
    loading,
    error,
    selectSport,
    refresh
  } = useSimpleSportsData();

  const [activeCategory, setActiveCategory] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [matchFilter, setMatchFilter] = useState<'live' | 'upcoming' | 'results'>('live');

  // Categorize sports
  const popularSports = sports.filter(s => 
    ['cricket', 'football', 'tennis', 'basketball', 'kabaddi'].includes(s.sport_type)
  );
  
  const ballSports = sports.filter(s => 
    ['cricket', 'football', 'tennis', 'basketball', 'volleyball', 'badminton', 'baseball', 'golf', 'rugby-league', 'rugby-union', 'soccer', 'futsal', 'beach-volleyball', 'handball', 'basketball-3x3'].includes(s.sport_type)
  );
  
  const racingSports = sports.filter(s => 
    ['horse-racing', 'greyhound-racing', 'motor-sports', 'formula1', 'motogp', 'motorbikes', 'cycling'].includes(s.sport_type)
  );
  
  const combatSports = sports.filter(s => 
    ['boxing', 'mma', 'wrestling', 'sumo'].includes(s.sport_type)
  );
  
  const eSports = sports.filter(s => 
    ['esoccer', 'e-games', 'esports', 'virtual-sports'].includes(s.sport_type)
  );
  
  const otherSports = sports.filter(s => 
    !ballSports.includes(s) && !racingSports.includes(s) && !combatSports.includes(s) && !eSports.includes(s)
  );

  const liveMatches = matches.filter(m => {
    const status = (m.status || '').toLowerCase();
    return m.isLive || status.includes('live') || status.includes('inplay') || status.includes('running');
  });

  const upcomingMatches = matches.filter(m => {
    const status = (m.status || '').toLowerCase();
    return !liveMatches.includes(m) && (
      status.includes('upcoming') ||
      status.includes('scheduled') ||
      status.includes('not started') ||
      status.includes('ns')
    );
  });

  const pastMatches = matches.filter(m => {
    const status = (m.status || '').toLowerCase();
    return !liveMatches.includes(m) && !upcomingMatches.includes(m) && (
      status.includes('finished') ||
      status.includes('result') ||
      status.includes('completed') ||
      status.includes('ended') ||
      status.includes('full') ||
      status.includes('ft')
    );
  });

  const SportButton = ({ sport }: { sport: any }) => (
    <Card
      onClick={() => selectSport(sport)}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 active:scale-95",
        "flex items-center justify-center min-w-[70px] h-[50px] sm:min-w-[100px] sm:h-[60px]",
        "group hover:shadow-lg hover:scale-105",
        selectedSport?.id === sport.id ? 
          "border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-md" : 
          "border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20"
      )}
    >
      {/* Animated background gradient on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0",
        "group-hover:opacity-100 transition-opacity duration-500",
        "group-hover:animate-pulse"
      )} />
      
      <span className={cn(
        "text-xs sm:text-sm font-bold text-center px-2 relative z-10 transition-colors duration-300",
        selectedSport?.id === sport.id ? 
          "text-primary bg-clip-text" : 
          "text-foreground group-hover:text-primary"
      )}>
        {sport.label}
      </span>
      
      {/* Selected indicator */}
      {selectedSport?.id === sport.id && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      )}
    </Card>
  );

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Sports Matches</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')} className="hidden sm:flex">
            <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
              <Grid2x2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" size="sm">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={refresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:px-4"
          >
            <RefreshCw className={cn("h-3 w-3 sm:h-4 sm:w-4 sm:mr-2", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Sports Selection with Categories */}
      <Card className="p-3 sm:p-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-8 sm:h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max">
              <TabsTrigger value="popular" className="text-xs px-2 sm:px-3">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Popular</span>
                <span className="sm:hidden">Pop</span>
              </TabsTrigger>
              <TabsTrigger value="ball" className="text-xs px-2 sm:px-3">
                <Globe className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Ball Sports</span>
                <span className="sm:hidden">Ball</span>
              </TabsTrigger>
              <TabsTrigger value="racing" className="text-xs px-2 sm:px-3">
                <Zap className="h-3 w-3 mr-1" />
                Racing
              </TabsTrigger>
              <TabsTrigger value="combat" className="text-xs px-2 sm:px-3">
                Combat
              </TabsTrigger>
              <TabsTrigger value="esports" className="text-xs px-2 sm:px-3">
                <Gamepad2 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">E-Sports</span>
                <span className="sm:hidden">E-S</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2 sm:px-3">
                All
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="popular" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {popularSports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ball" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {ballSports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="racing" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {racingSports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="combat" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {combatSports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="esports" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {eSports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2">
                {sports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Error State - Show proper message for unavailable API */}
      {error && !loading && (
        <Card className="p-8 border-warning/50 bg-warning/5">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-warning" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground max-w-md">
                The sports data service is currently unavailable due to high traffic. 
                Please wait a moment and try refreshing.
              </p>
              <Button 
                onClick={() => refresh()}
                variant="outline" 
                className="mt-4"
                disabled={loading}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Matches Display with filter tabs */}
      {!loading && !error && selectedSport && (
        <div className="space-y-4">
          <Tabs value={matchFilter} onValueChange={(v) => setMatchFilter(v as 'live' | 'upcoming' | 'results')} className="space-y-4">
            <TabsList className="grid w-full sm:w-[420px] grid-cols-3">
              <TabsTrigger value="live" className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                </span>
                Live
                {liveMatches.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {liveMatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                Upcoming
                {upcomingMatches.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {upcomingMatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                Results
                {pastMatches.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                    {pastMatches.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {liveMatches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No live {selectedSport.label} matches right now</p>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-3"
                )}>
                  {liveMatches.map((match) => (
                    <EnhancedSportsMatchCard 
                      key={match.id} 
                      match={match} 
                      sport={selectedSport.label} 
                      isLive 
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcomingMatches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming {selectedSport.label} matches scheduled</p>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-3"
                )}>
                  {upcomingMatches.map((match) => (
                    <EnhancedSportsMatchCard 
                      key={match.id} 
                      match={match} 
                      sport={selectedSport.label}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results">
              {pastMatches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No past {selectedSport.label} results available</p>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-3"
                )}>
                  {pastMatches.map((match) => (
                    <EnhancedSportsMatchCard 
                      key={match.id} 
                      match={match} 
                      sport={selectedSport.label}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* No Matches at all */}
          {matches.length === 0 && (
            <Card className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matches available</h3>
              <p className="text-muted-foreground">
                {selectedSport ? `No ${selectedSport.label} matches found` : 'Select a sport to view matches'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* No Sport Selected */}
      {!selectedSport && !loading && (
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Sport</h3>
          <p className="text-muted-foreground">
            Choose a sport from above to view available matches
          </p>
        </Card>
      )}
    </div>
  );
};
