import express from 'express';
import { asyncHandler } from '../middleware/rateLimiter';
import { config } from '../config/config';

const router = express.Router();

type Sport = 'football' | 'cricket' | 'hockey';

const BASES: Record<Sport, string> = {
  football: config.sportsApi.footballBase,
  cricket: config.sportsApi.cricketBase,
  hockey: config.sportsApi.hockeyBase,
};

const API_KEY = config.sportsApi.apiKey;

// Simple in-memory cache
const cache = new Map<string, { expires: number; data: any }>();

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { expires: now + ttlMs, data });
  return data;
}

function ensureSport(s: string): Sport {
  const sport = s?.toLowerCase() as Sport;
  if (!['football', 'cricket', 'hockey'].includes(sport)) {
    throw Object.assign(new Error('Unsupported sport'), { status: 400 });
  }
  return sport;
}

function headers() {
  return {
    'x-apisports-key': API_KEY,
    'content-type': 'application/json',
  } as Record<string, string>;
}

function buildFootballUrl(kind: 'live' | 'upcoming' | 'results', q: { date?: string }) {
  const base = BASES.football;
  const u = new URL(base + '/fixtures');
  if (kind === 'live') {
    u.searchParams.set('live', 'all');
  } else if (kind === 'upcoming') {
    if (q.date) {
      u.searchParams.set('date', q.date);
      u.searchParams.set('status', 'NS');
    } else {
      u.searchParams.set('next', '50');
    }
  } else if (kind === 'results') {
    if (q.date) {
      u.searchParams.set('date', q.date);
      u.searchParams.set('status', 'FT');
    } else {
      u.searchParams.set('last', '50');
    }
  }
  return u.toString();
}

function buildCricketUrl(kind: 'live' | 'upcoming' | 'results', q: { date?: string }) {
  // API-SPORTS Cricket base; using fixtures endpoint with similar params
  const base = BASES.cricket;
  const u = new URL(base + '/fixtures');
  if (kind === 'live') {
    u.searchParams.set('live', 'all');
  } else if (kind === 'upcoming') {
    if (q.date) u.searchParams.set('date', q.date);
    else u.searchParams.set('next', '50');
  } else if (kind === 'results') {
    if (q.date) u.searchParams.set('date', q.date);
    else u.searchParams.set('last', '50');
  }
  return u.toString();
}

function buildHockeyUrl(kind: 'live' | 'upcoming' | 'results', q: { date?: string }) {
  // API-SPORTS Hockey base; using games endpoint
  const base = BASES.hockey;
  const u = new URL(base + '/games');
  if (kind === 'live') {
    u.searchParams.set('live', 'all');
  } else if (kind === 'upcoming') {
    if (q.date) u.searchParams.set('date', q.date);
    else u.searchParams.set('next', '50');
  } else if (kind === 'results') {
    if (q.date) u.searchParams.set('date', q.date);
    else u.searchParams.set('last', '50');
  }
  return u.toString();
}

function buildUrl(sport: Sport, kind: 'live' | 'upcoming' | 'results', q: { date?: string }) {
  if (sport === 'football') return buildFootballUrl(kind, q);
  if (sport === 'cricket') return buildCricketUrl(kind, q);
  return buildHockeyUrl(kind, q);
}

function normalizeItem(sport: Sport, item: any) {
  // Try to map common fields safely with fallbacks
  const fixture = item.fixture || item.game || item.match || {};
  const league = item.league || item.league?.name || item.tournament || {};
  const teams = item.teams || item.teams?.home || item.homeTeam ? { home: item.teams?.home || item.homeTeam, away: item.teams?.away || item.awayTeam } : {};
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
    league: league?.name || item?.league?.name || item?.tournament?.name || 'Unknown',
    venue: fixture?.venue?.name || item?.venue?.name || null,
    status,
    statusShort,
    teams: { home: homeName, away: awayName },
    scores: { home: scoreHome, away: scoreAway },
    raw: item,
  };
}

async function doFetch(url: string) {
  if (!API_KEY) {
    const err: any = new Error('Sports API key not configured');
    err.status = 500;
    throw err;
  }
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`Upstream error: ${res.status} ${text}`);
    err.status = 502;
    throw err;
  }
  const json = await res.json();
  return json;
}

function filterByQuery(items: any[], q: { team?: string; date?: string }) {
  let out = items;
  if (q.team) {
    const t = q.team.toLowerCase();
    out = out.filter((it) => (
      (it.teams?.home || '').toLowerCase().includes(t) ||
      (it.teams?.away || '').toLowerCase().includes(t)
    ));
  }
  if (q.date) {
    out = out.filter((it) => it.date && String(it.date).slice(0, 10) === q.date);
  }
  return out;
}

function ttlMsFor(kind: 'live' | 'upcoming' | 'results') {
  const base = config.sportsApi.defaultTtlSeconds * 1000;
  if (kind === 'live') return base; // default ~10s
  return Math.max(base, 60_000); // 60s for non-live
}

async function handle(kind: 'live' | 'upcoming' | 'results', req: express.Request, res: express.Response) {
  const sport = ensureSport(req.params.sport);
  const q = { date: (req.query.date as string | undefined) };
  const team = (req.query.team as string | undefined);

  const url = buildUrl(sport, kind, q);
  const key = `${sport}:${kind}:${q.date || 'any'}`;
  const data = await cached(key, ttlMsFor(kind), async () => {
    const upstream = await doFetch(url);
    const list: any[] = upstream?.response || upstream?.results || upstream?.data || [];
    return list.map((it) => normalizeItem(sport, it));
  });

  const filtered = filterByQuery(data, { date: q.date, team });
  res.json({ sport, kind, count: filtered.length, items: filtered });
}

router.get('/:sport/live', asyncHandler(async (req, res) => handle('live', req, res)));
router.get('/:sport/upcoming', asyncHandler(async (req, res) => handle('upcoming', req, res)));
router.get('/:sport/results', asyncHandler(async (req, res) => handle('results', req, res)));

export default router;
