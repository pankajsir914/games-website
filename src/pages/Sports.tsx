import React, { useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

const sports: Array<'cricket' | 'football' | 'hockey' | 'basketball' | 'tennis' | 'kabaddi' | 'baseball' | 'table-tennis' | 'boxing'> = ['basketball', 'tennis', 'kabaddi', 'baseball', 'table-tennis', 'boxing', 'cricket', 'football', 'hockey'];

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

    // Auto-refresh live every 10s
    if (kind === 'live') {
      const id = setInterval(load, 10_000);
      return () => {
        mounted = false;
        clearInterval(id);
      };
    }

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

const MatchesList: React.FC<{ data: MatchItem[] | null; loading: boolean; error: string | null }>
= ({ data, loading, error }) => {
  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!data || data.length === 0) return <div className="text-muted-foreground">No matches.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((m, idx) => (
        <Card key={`${m.id ?? 'x'}-${idx}`} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{m.league}</CardTitle>
              <Badge variant="secondary">{m.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{m.date ? new Date(m.date).toLocaleString() : 'TBD'}{m.venue ? ` • ${m.venue}` : ''}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{m.teams.home}</span>
              <span>{m.scores.home ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{m.teams.away}</span>
              <span>{m.scores.away ?? '-'}</span>
            </div>
          </CardContent>
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

      <Section title="Live Matches" right={<Badge variant="outline">Auto-refresh 10s</Badge>}>
        <MatchesList {...live} />
      </Section>

      <Section title="Upcoming Matches">
        <MatchesList {...upcoming} />
      </Section>

      <Section title="Results">
        <MatchesList {...results} />
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

        <Tabs defaultValue="football" className="w-full">
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
