import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { RefreshCw, Trophy, Clock, AlertCircle, TrendingUp, Zap, Globe, Gamepad2 } from 'lucide-react';
import { useSimpleSportsData } from '@/hooks/useSimpleSportsData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Match Card Component
const MatchCard: React.FC<{ match: any; isLive?: boolean; sport: string }> = ({ match, isLive, sport }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Navigate to betting page with match ID and sport
    // Use eventId or id as fallback, since Diamond API uses gmid field
    const matchId = match.gmid || match.eventId || match.id;
    navigate(`/sports/bet/${sport}/${matchId}`, {
      state: { match, sport }
    });
  };
  
  return (
    <Card 
      onClick={handleClick}
      className={cn(
        "p-6 hover:shadow-lg transition-shadow cursor-pointer",
        isLive && "border-destructive/50 bg-destructive/5"
      )}>
      {isLive && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
          <span className="text-xs font-semibold text-destructive">LIVE</span>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{match.team1}</p>
            {match.score && (
              <p className="text-sm text-muted-foreground">{match.score.split('-')[0]}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">VS</span>
          <div className="space-y-1 text-right">
            <p className="font-semibold text-foreground">{match.team2}</p>
            {match.score && (
              <p className="text-sm text-muted-foreground">{match.score.split('-')[1]}</p>
            )}
          </div>
        </div>
        
        {!isLive && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {new Date(match.date).toLocaleDateString()}
              {match.time && ` at ${match.time}`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

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

  const liveMatches = matches.filter(m => m.isLive);
  const upcomingMatches = matches.filter(m => !m.isLive);

  const SportButton = ({ sport }: { sport: any }) => (
    <Card
      onClick={() => selectSport(sport)}
      className={cn(
        "p-3 cursor-pointer transition-all hover:shadow-md",
        "flex flex-col items-center justify-center min-w-[80px] h-[80px] sm:min-w-[100px] sm:h-[100px]",
        selectedSport?.id === sport.id ? 
          "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2" : 
          "border-border hover:border-primary/50"
      )}
    >
      <span className="text-xl sm:text-2xl mb-1 sm:mb-2">{sport.icon}</span>
      <span className={cn(
        "text-xs sm:text-sm font-medium text-center line-clamp-2",
        selectedSport?.id === sport.id ? "text-primary" : "text-foreground"
      )}>
        {sport.label}
      </span>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Sports Matches</h1>
        <Button
          onClick={refresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Sports Selection with Categories */}
      <Card className="p-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 p-2">
                {sports.map((sport) => (
                  <SportButton key={sport.id} sport={sport} />
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading matches</p>
              <p className="text-sm text-muted-foreground">{error}</p>
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

      {/* Matches Display */}
      {!loading && !error && selectedSport && (
        <div className="space-y-6">
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
                Live Matches
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} sport={selectedSport.label} isLive />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Upcoming Matches
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} sport={selectedSport.label} />
                ))}
              </div>
            </div>
          )}

          {/* No Matches */}
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