import React, { useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Import sports background images
import cricketBg from '@/assets/cricket-bg.jpg';
import footballBg from '@/assets/football-bg.jpg';
import basketballBg from '@/assets/basketball-bg.jpg';
import tennisBg from '@/assets/tennis-bg.jpg';
import hockeyBg from '@/assets/hockey-bg.jpg';
import sportsGenericBg from '@/assets/sports-generic-bg.jpg';

// Normalized match shape from backend
type MatchItem = {
  id: number | string | null;
  date: string | null;
  league: string;
  venue?: string | null;
  status: string;
  statusShort?: string;
  teams: { home: string; away: string };
  scores: { home: number | null; away: number | null };
};

const sports: Array<'cricket' | 'football' | 'hockey' | 'basketball' | 'tennis' | 'kabaddi' | 'baseball' | 'table-tennis' | 'boxing'> = ['cricket', 'football', 'basketball', 'tennis', 'hockey', 'kabaddi', 'baseball', 'table-tennis', 'boxing'];

// Function to get background image based on sport type
const getSportBackground = (sport: string): string => {
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

function useMatches(sport: string, kind: 'live' | 'upcoming' | 'results', team: string, date: string | null) {
  const [data, setData] = useState<MatchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useMemo(() => {
    const qs = new URLSearchParams();
    if (team.trim()) qs.set('team', team.trim());
    if (date) qs.set('date', date);
    return qs.toString();
  }, [team, date]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('sports-proxy', {
          body: { sport, kind, date, team }
        });
        if (error) throw new Error(error.message || 'Failed to load');
        const payload = data as any;
        if (mounted) setData((payload?.items || []) as MatchItem[]);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    // No auto-refresh to avoid constant loading

    return () => { mounted = false; };
  }, [sport, kind, q]);

  return { data, loading, error };
}

const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {right}
    </div>
    <div>{children}</div>
  </section>
);

const MatchesList: React.FC<{ data: MatchItem[] | null; loading: boolean; error: string | null; sport: string }>
= ({ data, loading, error, sport }) => {
  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!data || data.length === 0) return <div className="text-muted-foreground">No matches.</div>;
  
  const backgroundImage = getSportBackground(sport);
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((m, idx) => (
        <Card key={`${m.id ?? 'x'}-${idx}`} className="relative overflow-hidden hover:shadow-md transition-shadow group">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-300"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          
          {/* Content */}
          <div className="relative z-10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-foreground">{m.league}</CardTitle>
                <Badge variant="secondary">{m.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.date ? new Date(m.date).toLocaleString() : 'TBD'}{m.venue ? ` • ${m.venue}` : ''}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-lg font-semibold text-foreground">
                <span>{m.teams.home}</span>
                <span className="bg-primary/20 px-2 py-1 rounded text-primary-foreground">{m.scores.home ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-foreground mt-2">
                <span>{m.teams.away}</span>
                <span className="bg-primary/20 px-2 py-1 rounded text-primary-foreground">{m.scores.away ?? '-'}</span>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};

const SportPane: React.FC<{ sport: 'cricket' | 'football' | 'hockey' | 'basketball' | 'tennis' | 'kabaddi' | 'baseball' | 'table-tennis' | 'boxing' }>= ({ sport }) => {
  const [team, setTeam] = useState('');
  const [date, setDate] = useState<string | null>(null);

  const live = useMatches(sport, 'live', team, null);
  const upcoming = useMatches(sport, 'upcoming', team, date);
  const results = useMatches(sport, 'results', team, date);

  return (
    <div className="space-y-8">

      <Section title="Live Matches">
        <MatchesList {...live} sport={sport} />
      </Section>

      <Section title="Upcoming Matches">
        <MatchesList {...upcoming} sport={sport} />
      </Section>

      <Section title="Results">
        <MatchesList {...results} sport={sport} />
      </Section>
    </div>
  );
};

const Sports: React.FC = () => {
  useEffect(() => {
    document.title = 'Sports Dashboard — Cricket, Football, Hockey';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sports Dashboard — Live, Upcoming, Results</h1>
          <p className="text-muted-foreground">Cricket, Football and Hockey scores with live auto-refresh.</p>
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
