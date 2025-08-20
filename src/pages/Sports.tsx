import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSportsData, useAutoRefresh, type SportsMatch } from '@/hooks/useSportsData';
import { MatchCard } from '@/components/sports/MatchCard';
import { BetSlip } from '@/components/sports/BetSlip';


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
  const [selectedBet, setSelectedBet] = useState<{ odds: any; type: string } | null>(null);
  
  const { data: liveData, loading: liveLoading, error: liveError, refresh: refreshLive } = useSportsData(sport, 'live');
  const { data: upcomingData, loading: upcomingLoading, error: upcomingError, refresh: refreshUpcoming } = useSportsData(sport, 'upcoming');
  const { data: resultsData, loading: resultsLoading, error: resultsError, refresh: refreshResults } = useSportsData(sport, 'results');

  // Auto-refresh live matches every 30 seconds
  useAutoRefresh(refreshLive, 30, true);

  const handleBetSelect = (odds: any, type: string) => {
    setSelectedBet({ odds, type });
  };

  const sportBackground = getSportBackground(sport);

  const renderMatches = (data: SportsMatch[] | null, loading: boolean, error: string | null, title: string, refreshFn?: () => void) => (
    <Section 
      title={title}
      right={refreshFn && (
        <Button variant="ghost" size="sm" onClick={refreshFn}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {error && <div className="text-destructive">{error}</div>}
      {!loading && !error && (!data || data.length === 0) && <div className="text-muted-foreground">No matches.</div>}
      {data && data.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {data.slice(0, 3).map((match, idx) => (
                <div key={`${match.id ?? 'x'}-${idx}`} className="flex-none w-96">
                  <MatchCard
                    match={match}
                    sportBackground={sportBackground}
                    onBetSelect={handleBetSelect}
                    showBetting={title !== 'Results'} // Hide betting for completed matches
                    isLandscape={true}
                  />
                </div>
              ))}
            </div>
          </div>
          {data.length > 3 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="default"
                onClick={() => navigate(`/sports/${sport}/${title.toLowerCase().replace(' ', '-')}`)}
                className="bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border-primary/20"
              >
                See More ({data.length - 3} more matches)
              </Button>
            </div>
          )}
        </div>
      )}
    </Section>
  );

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-8">
        
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {renderMatches(liveData, liveLoading, liveError, "Live Matches", refreshLive)}
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {renderMatches(upcomingData, upcomingLoading, upcomingError, "Upcoming Matches", refreshUpcoming)}
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {renderMatches(resultsData, resultsLoading, resultsError, "Results", refreshResults)}
        </div>
      </div>
      
      {/* Bet Slip Sidebar */}
      <div className="w-80 hidden lg:block">
        <div className="sticky top-24">
          <BetSlip
            match={selectedBet ? (liveData?.[0] || upcomingData?.[0]) as SportsMatch : null as any}
            selectedBet={selectedBet}
            onClose={() => setSelectedBet(null)}
          />
        </div>
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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sports Dashboard</h1>
          <p className="text-muted-foreground">Live matches, upcoming fixtures, and results with real-time betting odds.</p>
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
