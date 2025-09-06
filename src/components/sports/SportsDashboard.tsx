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
import { Loader2, Trophy, Activity, Timer, TrendingUp } from 'lucide-react';
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
  const { getMatchData, refreshMatchData } = useSportsDataContext();

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

      {/* Stats Bar */}
      <div className="px-4 py-6 border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            {stats.map((stat) => (
              <Card key={stat.label} className="flex-1 min-w-[140px] p-4 bg-gradient-to-br from-card to-card/80 border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-background/50", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Bar */}
        <SportsFilterBar
          filter={filter}
          onFilterChange={setFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Sports Selection */}
        {isMobile ? (
          <div className="mb-6">
            <Select value={selectedSport} onValueChange={(value) => setSelectedSport(value as Sport)}>
              <SelectTrigger className="w-full bg-card border-primary/20">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport} className="capitalize">
                    {sport.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : isTablet ? (
          <ScrollArea className="w-full mb-6">
            <div className="flex gap-2 pb-2">
              {sports.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  onClick={() => setSelectedSport(sport)}
                  className="capitalize flex-shrink-0"
                >
                  {sport.replace('-', ' ')}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            {sports.map((sport) => (
              <SportCard
                key={sport}
                sport={sport}
                isSelected={selectedSport === sport}
                onClick={() => setSelectedSport(sport)}
                liveCount={sport === selectedSport ? totalLiveMatches : 0}
              />
            ))}
          </div>
        )}

        {/* Match Content */}
        <div className="space-y-8">
          {/* Live Matches */}
          {(filter === 'all' || filter === 'live') && totalLiveMatches > 0 && (
            <section className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  Live Matches
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshMatchData(selectedSport, 'live')}
                  disabled={liveQuery.isFetching}
                >
                  {liveQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
              <div className={cn(
                "gap-4",
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {liveQuery.data?.map((match: any) => (
                  <div key={match.id} className="animate-scale-in">
                    {isMobile ? (
                      <MatchCardMobile match={match} sport={selectedSport} isLive={true} />
                    ) : (
                      <EnhancedMatchCard
                        match={match}
                        sport={selectedSport}
                        showBetting={true}
                        showOdds={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Matches */}
          {(filter === 'all' || filter === 'upcoming' || filter === 'today') && (
            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {filter === 'today' ? "Today's Matches" : 'Upcoming Matches'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshMatchData(selectedSport, 'upcoming')}
                  disabled={upcomingQuery.isFetching}
                >
                  {upcomingQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
              {upcomingQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "space-y-4"
                )}>
                  {upcomingQuery.data
                    ?.filter((match: any) => {
                      if (filter === 'today') {
                        const matchDate = new Date(match.date);
                        const today = new Date();
                        return matchDate.toDateString() === today.toDateString();
                      }
                      return true;
                    })
                    .slice(0, 9)
                    .map((match: any) => (
                      <div key={match.id} className="animate-scale-in">
                        {isMobile ? (
                          <MatchCardMobile match={match} sport={selectedSport} />
                        ) : (
                          <EnhancedMatchCard
                            match={match}
                            sport={selectedSport}
                            showBetting={true}
                            showOdds={true}
                          />
                        )}
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Results */}
          {filter === 'all' && (
            <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Results</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshMatchData(selectedSport, 'results')}
                  disabled={resultsQuery.isFetching}
                >
                  {resultsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
              {resultsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "space-y-4"
                )}>
                  {resultsQuery.data?.slice(0, 6).map((match: any) => (
                    <div key={match.id} className="animate-scale-in opacity-80">
                      {isMobile ? (
                        <MatchCardMobile match={match} sport={selectedSport} isCompleted={true} />
                      ) : (
                        <EnhancedMatchCard
                          match={match}
                          sport={selectedSport}
                          showBetting={false}
                          showOdds={false}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};