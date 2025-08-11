// Supabase Edge Function: sports-proxy
// Securely fetches sports data from API-SPORTS and returns normalized results
// Supports caching and filtering. Public function with CORS enabled.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

type Sport = 'football' | 'cricket' | 'hockey';

type Kind = 'live' | 'upcoming' | 'results';

const API_KEY = Deno.env.get('SPORTS_API_KEY') || '';
const CRICAPI_KEY = Deno.env.get('CRICAPI_KEY') || Deno.env.get('SPORTS_API_KEY') || '';
const FOOTBALL_BASE = Deno.env.get('SPORTS_API_FOOTBALL_BASE') || 'https://v3.football.api-sports.io';
const CRICKET_BASE = Deno.env.get('SPORTS_API_CRICKET_BASE') || 'https://api.cricapi.com/v1';
const HOCKEY_BASE = Deno.env.get('SPORTS_API_HOCKEY_BASE') || 'https://v1.hockey.api-sports.io';
const DEFAULT_TTL = Number(Deno.env.get('SPORTS_CACHE_TTL') || '10'); // seconds

const BASES: Record<Sport, string> = {
  football: FOOTBALL_BASE,
  cricket: CRICKET_BASE,
  hockey: HOCKEY_BASE,
};

// Simple in-memory cache (per function instance)
const cache = new Map<string, { expires: number; data: any }>();

function ttlMsFor(kind: Kind) {
  const base = Math.max(1, DEFAULT_TTL) * 1000;
  return kind === 'live' ? base : Math.max(base, 60_000);
}

function ensureSport(s: string | undefined): Sport {
  const v = (s || '').toLowerCase() as Sport;
  if (!['football', 'cricket', 'hockey'].includes(v)) {
    throw Object.assign(new Error('Unsupported sport'), { status: 400 });
  }
  return v;
}

function buildUrl(sport: Sport, kind: Kind, q: { date?: string }) {
  if (sport === 'football') {
    const u = new URL(BASES.football + '/fixtures');
    if (kind === 'live') u.searchParams.set('live', 'all');
    else if (kind === 'upcoming') {
      if (q.date) { u.searchParams.set('date', q.date); u.searchParams.set('status', 'NS'); }
      else u.searchParams.set('next', '50');
    } else if (kind === 'results') {
      if (q.date) { u.searchParams.set('date', q.date); u.searchParams.set('status', 'FT'); }
      else u.searchParams.set('last', '50');
    }
    return u.toString();
  }
  if (sport === 'cricket') {
    const path = kind === 'live' ? '/currentMatches' : '/matches';
    const u = new URL(BASES.cricket + path);
    u.searchParams.set('apikey', CRICAPI_KEY);
    u.searchParams.set('offset', '0');
    if (q.date) u.searchParams.set('date', q.date);
    return u.toString();
  }
  // hockey
  const u = new URL(BASES.hockey + '/games');
  if (kind === 'live') u.searchParams.set('live', 'all');
  else if (kind === 'upcoming') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('next', '50'); }
  else if (kind === 'results') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('last', '50'); }
  return u.toString();
}

function normalizeItem(sport: Sport, item: any) {
  // CricAPI normalization
  if (sport === 'cricket') {
    const id = item.id || item.matchId || item.unique_id || null;
    const date = item.date || item.dateTimeGMT || item.matchStartTime || null;
    const status: string = item.status || item.ms || 'N/A';
    const leagueName = item.series || item.name || 'Cricket';
    const venue = item.venue || item.ground || null;

    let home = 'Home';
    let away = 'Away';
    if (Array.isArray(item.teamInfo) && item.teamInfo.length >= 2) {
      home = item.teamInfo[0]?.shortname || item.teamInfo[0]?.name || home;
      away = item.teamInfo[1]?.shortname || item.teamInfo[1]?.name || away;
    } else if (Array.isArray(item.teams) && item.teams.length >= 2) {
      home = item.teams[0] || home;
      away = item.teams[1] || away;
    }

    let scoreHome: number | null = null;
    let scoreAway: number | null = null;
    if (Array.isArray(item.score)) {
      scoreHome = typeof item.score[0]?.r === 'number' ? item.score[0].r : scoreHome;
      scoreAway = typeof item.score[1]?.r === 'number' ? item.score[1].r : scoreAway;
    }

    return {
      sport,
      id,
      date,
      league: leagueName,
      venue,
      status,
      teams: { home, away },
      scores: { home: scoreHome, away: scoreAway },
      raw: item,
    };
  }

  // Default (API-SPORTS football/hockey) normalization
  const fixture = item.fixture || item.game || item.match || {};
  const leagueMeta = item.league || item.tournament || {};
  const teams = item.teams || (item.homeTeam || item.awayTeam ? { home: item.homeTeam, away: item.awayTeam } : {});
  const goals = item.goals || item.score || item.scores || {};

  const homeName = teams?.home?.name || teams?.home?.team?.name || item.home?.name || 'Home';
  const awayName = teams?.away?.name || teams?.away?.team?.name || item.away?.name || 'Away';

  const scoreHome = goals?.home ?? goals?.home?.total ?? goals?.home?.goals ?? item?.scores?.home ?? null;
  const scoreAway = goals?.away ?? goals?.away?.total ?? goals?.away?.goals ?? item?.scores?.away ?? null;

  const status = fixture?.status?.long || fixture?.status?.short || item?.status?.long || item?.status || 'N/A';
  const statusShort = fixture?.status?.short || item?.status?.short || undefined;

  return {
    sport,
    id: fixture?.id || item?.id || item?.game?.id || null,
    date: fixture?.date || item?.date || item?.time?.date || null,
    league: leagueMeta?.name || item?.league?.name || item?.tournament?.name || 'Unknown',
    venue: fixture?.venue?.name || item?.venue?.name || null,
    status,
    statusShort,
    teams: { home: homeName, away: awayName },
    scores: { home: scoreHome, away: scoreAway },
    raw: item,
  };
}

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { expires: now + ttlMs, data });
  return data;
}

async function doFetch(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`Upstream error: ${res.status} ${text}`);
    err.status = 502;
    throw err;
  }
  return res.json();
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    const { sport, kind, date, team } = await req.json() as { sport?: string; kind?: Kind; date?: string | null; team?: string | null };

    const s = ensureSport(sport);
    const k = (kind || 'live') as Kind;
    const q = { date: date || undefined };

    const url = buildUrl(s, k, q);
    const key = `${s}:${k}:${q.date || 'any'}`;

    const data = await cached(key, ttlMsFor(k), async () => {
      if (s !== 'cricket' && !API_KEY) {
        const err: any = new Error('Sports API key not configured'); err.status = 500; throw err;
      }
      if (s === 'cricket' && !CRICAPI_KEY) {
        const err: any = new Error('Cricket API key not configured'); err.status = 500; throw err;
      }
      const headers = s === 'cricket' ? undefined : { 'x-apisports-key': API_KEY, 'content-type': 'application/json' } as Record<string,string> | undefined;
      const upstream = await doFetch(url, headers);
      const list: any[] = upstream?.response || upstream?.results || upstream?.data || [];
      let normalized = list.map((it) => normalizeItem(s, it));
      if (s === 'cricket') {
        if (k === 'upcoming') {
          normalized = normalized.filter((it) => {
            const sl = String(it.status || '').toLowerCase();
            return sl.includes('not started') || sl.includes('upcoming') || sl.includes('schedule');
          });
        } else if (k === 'results') {
          normalized = normalized.filter((it) => {
            const sl = String(it.status || '').toLowerCase();
            return sl.includes('won') || sl.includes('result') || sl.includes('completed') || sl.includes('draw') || sl.includes('tied') || sl.includes('abandoned');
          });
        }
      }
      return normalized;
    });

    // Filter client-side by team/date for safety
    let filtered = data as any[];
    const t = (team || '').toLowerCase();
    if (t) {
      filtered = filtered.filter((it) => (
        (it.teams?.home || '').toLowerCase().includes(t) ||
        (it.teams?.away || '').toLowerCase().includes(t)
      ));
    }
    if (q.date) {
      filtered = filtered.filter((it) => it.date && String(it.date).slice(0, 10) === q.date);
    }

    return new Response(JSON.stringify({ sport: s, kind: k, count: filtered.length, items: filtered }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (e) {
    const status = (e as any).status || 500;
    return new Response(JSON.stringify({ error: (e as Error).message || 'Internal error' }), { status, headers: corsHeaders });
  }
});
