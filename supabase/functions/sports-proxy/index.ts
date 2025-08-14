// Supabase Edge Function: sports-proxy
// Securely fetches sports data from API-SPORTS and returns normalized results
// Supports caching and filtering. Public function with CORS enabled.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

type Sport = 'football' | 'cricket' | 'hockey' | 'basketball' | 'tennis' | 'baseball' | 'boxing' | 'kabaddi' | 'table-tennis';

type Kind = 'live' | 'upcoming' | 'results';

const API_KEY = Deno.env.get('SPORTS_API_KEY') || '';
const CRICAPI_KEY = 'a4cd2ec0-4175-4263-868a-22ef5cbd9316'; // Public cricket API key
const FOOTBALL_BASE = Deno.env.get('SPORTS_API_FOOTBALL_BASE') || 'https://v3.football.api-sports.io';
const CRICKET_BASE = 'https://api.cricapi.com/v1';
const HOCKEY_BASE = Deno.env.get('SPORTS_API_HOCKEY_BASE') || 'https://v1.hockey.api-sports.io';
const BASKETBALL_BASE = Deno.env.get('SPORTS_API_BASKETBALL_BASE') || 'https://v1.basketball.api-sports.io';
const TENNIS_BASE = Deno.env.get('SPORTS_API_TENNIS_BASE') || 'https://v1.tennis.api-sports.io';
const BASEBALL_BASE = Deno.env.get('SPORTS_API_BASEBALL_BASE') || 'https://v1.baseball.api-sports.io';
const DEFAULT_TTL = Number(Deno.env.get('SPORTS_CACHE_TTL') || '10'); // seconds

const BASES: Record<Sport, string> = {
  football: FOOTBALL_BASE,
  cricket: CRICKET_BASE,
  hockey: HOCKEY_BASE,
  basketball: BASKETBALL_BASE,
  tennis: TENNIS_BASE,
  baseball: BASEBALL_BASE,
  boxing: '',
  kabaddi: '',
  'table-tennis': '',
};

// Simple in-memory cache (per function instance)
const cache = new Map<string, { expires: number; data: any }>();

function ttlMsFor(kind: Kind) {
  const base = Math.max(1, DEFAULT_TTL) * 1000;
  return kind === 'live' ? base : Math.max(base, 60_000);
}

function ensureSport(s: string | undefined): Sport {
  const v = (s || '').toLowerCase() as Sport;
  if (!['football', 'cricket', 'hockey', 'basketball', 'tennis', 'baseball', 'boxing', 'kabaddi', 'table-tennis'].includes(v)) {
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
    // For cricket API: currentMatches for live, matches for upcoming/results
    const path = kind === 'live' ? '/currentMatches' : '/matches';
    const u = new URL(BASES.cricket + path);
    u.searchParams.set('apikey', CRICAPI_KEY);
    u.searchParams.set('offset', '0');
    if (q.date) u.searchParams.set('date', q.date);
    return u.toString();
  }
  if (sport === 'hockey' || sport === 'basketball' || sport === 'baseball' || sport === 'tennis') {
    const u = new URL(BASES[sport] + '/games');
    if (kind === 'live') u.searchParams.set('live', 'all');
    else if (kind === 'upcoming') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('next', '50'); }
    else if (kind === 'results') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('last', '50'); }
    return u.toString();
  }
  // Unsupported for now: boxing, kabaddi, table-tennis
  return '';
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
  const baseHeaders: Record<string, string> = {
    'accept': 'application/json',
    'user-agent': 'supabase-edge/1.0',
    ...(headers || {}),
  };

  let lastErr: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: baseHeaders });
      if (!res.ok) {
        const text = await res.text();
        const err: any = new Error(`Upstream error: ${res.status} ${text}`);
        err.status = 502;
        throw err;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
      // Retry only on network errors or connection resets
      const msg = String((e as Error).message || '').toLowerCase();
      if (!msg.includes('connection') && !msg.includes('reset') && !msg.includes('timeout')) break;
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  const err: any = new Error(`Upstream fetch failed after retries: ${lastErr?.message || 'unknown error'}`);
  err.status = (lastErr && (lastErr as any).status) || 502;
  throw err;
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
if (!url) {
  return new Response(JSON.stringify({ sport: s, kind: k, count: 0, items: [] }), {
    headers: corsHeaders,
    status: 200,
  });
}
const key = `${s}:${k}:${q.date || 'any'}`;

    const data = await cached(key, ttlMsFor(k), async () => {
      if (s !== 'cricket' && !API_KEY) {
        const err: any = new Error('Sports API key not configured'); err.status = 500; throw err;
      }
      if (s === 'cricket' && !CRICAPI_KEY) {
        const err: any = new Error('Cricket API key not configured'); err.status = 500; throw err;
      }
      
      try {
        const headers = s === 'cricket'
          ? { 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' } as Record<string, string>
          : { 'x-apisports-key': API_KEY, 'content-type': 'application/json', 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' } as Record<string, string>;
        
        console.log(`Fetching ${s} data from: ${url}`);
        const upstream = await doFetch(url, headers);
        console.log(`${s} API response:`, JSON.stringify(upstream, null, 2));
        
        // Cricket API returns data in 'data' array
        const list: any[] = s === 'cricket' ? (upstream?.data || []) : (upstream?.response || upstream?.results || upstream?.data || []);
        console.log(`${s} raw data list length:`, list.length);
        
        let normalized = list.map((it) => normalizeItem(s, it));
        console.log(`${s} normalized data:`, normalized.length, 'items');
        
        if (s === 'cricket') {
          if (k === 'upcoming') {
            normalized = normalized.filter((it) => {
              const sl = String(it.status || '').toLowerCase();
              return sl.includes('not started') || sl.includes('upcoming') || sl.includes('schedule') || sl.includes('fixture');
            });
          } else if (k === 'results') {
            normalized = normalized.filter((it) => {
              const sl = String(it.status || '').toLowerCase();
              return sl.includes('won') || sl.includes('result') || sl.includes('completed') || sl.includes('draw') || sl.includes('tied') || sl.includes('abandoned') || sl.includes('finished');
            });
          }
          console.log(`${s} after filtering for ${k}:`, normalized.length, 'items');
        }
        return normalized;
      } catch (error) {
        console.error(`Error fetching ${s} data:`, error);
        // Return empty array instead of throwing for cricket API failures
        if (s === 'cricket') {
          return [];
        }
        throw error;
      }
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
