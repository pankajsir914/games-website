import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Info, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSportsDataContext } from '@/contexts/SportsDataContext';
import { MatchCard } from '@/components/sports/MatchCard';
import { FootballMatchCard } from '@/components/sports/FootballMatchCard';
import { CricketMatchCard } from '@/components/sports/CricketMatchCard';
import { EnhancedMatchCard } from '@/components/sports/EnhancedMatchCard';
import { MatchCardSkeleton } from '@/components/sports/MatchCardSkeleton';
import { DiamondSportsCard } from '@/components/sports/DiamondSportsCard';
import { toast } from 'sonner';


// Import sports background images
import cricketBg from '@/assets/cricket-bg.jpg';
import footballBg from '@/assets/football-bg.jpg';
import basketballBg from '@/assets/basketball-bg.jpg';
import tennisBg from '@/assets/tennis-bg.jpg';
import hockeyBg from '@/assets/hockey-bg.jpg';
import sportsGenericBg from '@/assets/sports-generic-bg.jpg';

const sports: Array<'cricket' | 'football' | 'hockey' | 'basketball' | 'tennis' | 'kabaddi' | 'baseball' | 'table-tennis' | 'boxing'> = ['cricket', 'football', 'basketball', 'tennis', 'hockey', 'kabaddi', 'baseball', 'table-tennis', 'boxing'];

// Function to get background image based on sport type
const getSportBackground = (sport: string): string => {
  if (!sport) {
    return sportsGenericBg;
  }
  
  switch (sport.toLowerCase()) {
    case 'cricket':
      return cricketBg;
    case 'football':
      return footballBg;
    case 'basketball':
      return basketballBg;
    case 'tennis':
      return tennisBg;
    case 'hockey':
      return hockeyBg;
    default:
      return sportsGenericBg;
  }
};

const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {right}
    </div>
    <div>{children}</div>
  </section>
);

const SportPane: React.FC<{ sport: 'cricket' | 'football' | 'hockey' | 'basketball' | 'tennis' | 'kabaddi' | 'baseball' | 'table-tennis' | 'boxing' }>= ({ sport }) => {
  const navigate = useNavigate();
  const { getMatchData, refreshMatchData, lastUpdated } = useSportsDataContext();
  
  const liveQuery = getMatchData(sport, 'live');
  const upcomingQuery = getMatchData(sport, 'upcoming');
  const resultsQuery = getMatchData(sport, 'results');

  const sportBackground = getSportBackground(sport);

  const renderMatches = (
    query: any, 
    title: string, 
    kind: 'live' | 'upcoming' | 'results'
  ) => {
    const lastUpdate = lastUpdated[`${sport}_${kind}`];
    
    return (
      <Section 
        title={title}
        right={
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refreshMatchData(sport, kind)}
              disabled={query.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      >
        {query.isLoading && (
          <div className="space-y-4">
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {[1, 2, 3].map((idx) => (
                  <div key={`skeleton-${idx}`} className="flex-none w-96">
                    <MatchCardSkeleton isLandscape={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {query.error && <div className="text-destructive">Error loading matches. Please try again.</div>}
        {!query.isLoading && !query.error && (!query.data || query.data.length === 0) && (
          <div className="text-muted-foreground">No matches available.</div>
        )}
        {!query.isLoading && query.data && query.data.length > 0 && (
          <div className="space-y-4">
            <div className="relative">
              {/* Subtle fetching indicator */}
              {query.isFetching && !query.isLoading && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    Updating...
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {query.data.slice(0, 3).map((match: any, idx: number) => (
                  <div 
                    key={`${match.id ?? 'x'}-${idx}`} 
                    className="flex-none w-96 transition-all duration-500 ease-in-out"
                  >
                    {/* Use DiamondSportsCard for matches from Diamond API */}
                    {match.provider === 'diamond' ? (
                      <DiamondSportsCard
                        match={match}
                        sport={sport}
                        showOdds={title !== 'Results'}
                        showLiveTV={title === 'Live Matches'}
                        onBetClick={(match, odds) => {
                          toast.success('Bet placement coming soon!');
                          console.log('Bet placed:', { match, odds });
                        }}
                      />
                    ) : (sport === 'football' || sport === 'basketball') ? (
                      <EnhancedMatchCard
                        match={match}
                        sport={sport}
                        showBetting={title !== 'Results'}
                        showOdds={title !== 'Results'}
                      />
                    ) : sport === 'cricket' ? (
                      <CricketMatchCard
                        match={match}
                      />
                    ) : (
                      <MatchCard
                        match={match}
                        sportBackground={sportBackground}
                        showBetting={title !== 'Results'}
                        isLandscape={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {query.data.length > 3 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => navigate(`/sports/${sport}/${title.toLowerCase().replace(' ', '-')}`)}
                  className="bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border-primary/20"
                >
                  See More ({query.data.length - 3} more matches)
                </Button>
              </div>
            )}
          </div>
        )}
      </Section>
    );
  };

  return (
    <div className="space-y-8">
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {renderMatches(liveQuery, "Live Matches", 'live')}
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        {renderMatches(upcomingQuery, "Upcoming Matches", 'upcoming')}
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {renderMatches(resultsQuery, "Results", 'results')}
      </div>
    </div>
  );
};

const Sports: React.FC = () => {
  useEffect(() => {
    document.title = 'Sports Dashboard — Live Matches & Betting';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sports Dashboard</h1>
            <p className="text-muted-foreground">Live matches, upcoming fixtures, and results with intelligent caching.</p>
          </div>
          <div className="text-xs text-muted-foreground bg-card border rounded-lg px-3 py-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Cached data active</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="cricket" className="w-full">
          <TabsList className="mb-4">
            {sports.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
            ))}
          </TabsList>

          {sports.map((s) => (
            <TabsContent key={s} value={s} className="space-y-6">
              <SportPane sport={s} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Sports;