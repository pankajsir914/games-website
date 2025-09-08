// Supabase Edge Function: sports-proxy
// Hybrid sports data system:
// - SportsMonk for comprehensive match data, fixtures, teams, leagues
// - Separate odds provider for betting odds and lines
// Supports caching and filtering. Public function with CORS enabled.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

type Sport = 'football' | 'cricket' | 'hockey' | 'basketball' | 'tennis' | 'baseball' | 'boxing' | 'kabaddi' | 'table-tennis';

type Kind = 'live' | 'upcoming' | 'results';

// API Keys
const API_KEY = Deno.env.get('SPORTS_API_KEY') || '';
const CRICAPI_KEY = Deno.env.get('CRICAPI_KEY');
const SPORTMONKS_API_TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN') || '';
const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY') || '';
const ENTITYSPORT_API_TOKEN = Deno.env.get('ENTITYSPORT_API_TOKEN') || '';

console.log('API Keys Status:', {
  SPORTS_API_KEY: API_KEY ? 'configured' : 'missing',
  CRICAPI_KEY: CRICAPI_KEY ? 'configured' : 'missing',
  SPORTMONKS_API_TOKEN: SPORTMONKS_API_TOKEN ? 'configured' : 'missing',
  ODDS_API_KEY: ODDS_API_KEY ? 'configured' : 'missing',
  ENTITYSPORT_API_TOKEN: ENTITYSPORT_API_TOKEN ? 'configured' : 'missing',
});

// API Base URLs
const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const FOOTBALL_BASE = Deno.env.get('SPORTS_API_FOOTBALL_BASE') || 'https://v3.football.api-sports.io';
const CRICKET_BASE = 'https://api.cricapi.com/v1';
const HOCKEY_BASE = Deno.env.get('SPORTS_API_HOCKEY_BASE') || 'https://v1.hockey.api-sports.io';
const BASKETBALL_BASE = Deno.env.get('SPORTS_API_BASKETBALL_BASE') || 'https://v1.basketball.api-sports.io';
const TENNIS_BASE = Deno.env.get('SPORTS_API_TENNIS_BASE') || 'https://v1.tennis.api-sports.io';
const BASEBALL_BASE = Deno.env.get('SPORTS_API_BASEBALL_BASE') || 'https://v1.baseball.api-sports.io';
const CRICKET_APISPORTS_BASE = Deno.env.get('SPORTS_API_CRICKET_BASE') || 'https://v1.cricket.api-sports.io';
const ENTITYSPORT_BASE = 'https://restapi.entitysport.com/v2';
const DEFAULT_TTL = Number(Deno.env.get('SPORTS_CACHE_TTL') || '10'); // seconds

const BASES: Record<Sport, string> = {
  football: SPORTMONKS_BASE,  // Changed to use SportsMonk for football
  cricket: CRICKET_BASE,
  hockey: HOCKEY_BASE,
  basketball: SPORTMONKS_BASE,  // SportsMonk also supports basketball
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
  // SportsMonk API for football and basketball
  if (sport === 'football' || sport === 'basketball') {
    if (SPORTMONKS_API_TOKEN) {
      const sportPath = sport === 'football' ? 'football' : 'basketball';
      const u = new URL(`${SPORTMONKS_BASE}/${sportPath}/fixtures`);
      
      // Add API token
      u.searchParams.set('api_token', SPORTMONKS_API_TOKEN);
      
      // Include essential data - correct field names for v3
      if (sport === 'football') {
        u.searchParams.set('include', 'participants,league,venue,state,scores');
      } else {
        // Basketball has different includes
        u.searchParams.set('include', 'participants,league,venue,state,scores');
      }
      
      // Filter by status - correct format for filters
      if (kind === 'live') {
        u.searchParams.set('filters', 'statusCode:LIVE,HT,ET,PEN_LIVE,BREAK');
      } else if (kind === 'upcoming') {
        u.searchParams.set('filters', 'statusCode:NS,TBA,POSTPONED');
        if (q.date) {
          u.searchParams.set('filters', `statusCode:NS,TBA,POSTPONED;startsBetween:${q.date} 00:00:00,${q.date} 23:59:59`);
        }
      } else if (kind === 'results') {
        u.searchParams.set('filters', 'statusCode:FT,AET,FT_PEN,CANCELLED,AWARDED,ABANDONED');
        if (q.date) {
          u.searchParams.set('filters', `statusCode:FT,AET,FT_PEN;startsBetween:${q.date} 00:00:00,${q.date} 23:59:59`);
        }
      }
      
      return u.toString();
    } else {
      // Fallback to API-SPORTS if SportsMonk token not available
      const u = new URL(FOOTBALL_BASE + '/fixtures');
      if (kind === 'live') u.searchParams.set('live', 'all');
      else if (kind === 'upcoming') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('next', '50'); }
      else if (kind === 'results') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('last', '50'); }
      return u.toString();
    }
  }
  
  if (sport === 'cricket') {
    // Prefer API-SPORTS in main logic; build CricAPI URL only if key is present for fallback
    const endpoint = kind === 'live' ? '/cricScore' : '/matches';
    if (!CRICAPI_KEY) {
      return '';
    }
    const u = new URL(BASES.cricket + endpoint);
    u.searchParams.set('apikey', CRICAPI_KEY);
    if (endpoint !== '/cricScore') u.searchParams.set('offset', '0');
    return u.toString();
  }
  
  if (sport === 'hockey' || sport === 'baseball' || sport === 'tennis') {
    const u = new URL(BASES[sport] + '/games');
    if (kind === 'live') u.searchParams.set('live', 'all');
    else if (kind === 'upcoming') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('next', '50'); }
    else if (kind === 'results') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('last', '50'); }
    return u.toString();
  }
  // Unsupported for now: boxing, kabaddi, table-tennis
  return '';
}

// Additional function to get fallback cricket URLs
function getCricketFallbackUrls(): string[] {
  if (!CRICAPI_KEY) return [];
  return [
    `${BASES.cricket}/currentMatches?apikey=${CRICAPI_KEY}&offset=0`,
    `${BASES.cricket}/matches?apikey=${CRICAPI_KEY}&offset=0`
  ];
}

function normalizeItem(sport: Sport, item: any) {
  // CricAPI normalization and API-SPORTS cricket support
  if (sport === 'cricket') {
    // SportMonks cricket (v2) shape
    if (item && (item.localteam || item.visitorteam)) {
      const homeName = item.localteam?.name || item.localteam?.short_code || 'Home';
      const awayName = item.visitorteam?.name || item.visitorteam?.short_code || 'Away';
      const status = item.status?.name || item.status || item.state?.state || 'N/A';
      const date = item.starting_at || item.starting_at_timestamp || item.starting_at_date || item.date || null;

      let scoreHome: number | null = null;
      let scoreAway: number | null = null;
      if (Array.isArray(item.runs)) {
        const homeRun = item.runs.find((r: any) => r.team_id === item.localteam_id);
        const awayRun = item.runs.find((r: any) => r.team_id === item.visitorteam_id);
        const getTotal = (r: any) => (r?.score?.total ?? r?.total ?? r?.runs ?? null);
        scoreHome = homeRun ? getTotal(homeRun) : null;
        scoreAway = awayRun ? getTotal(awayRun) : null;
      }

      return {
        sport,
        id: item.id || null,
        date,
        league: item.league?.name || 'Cricket',
        venue: item.venue?.name || null,
        status,
        teams: { home: homeName, away: awayName },
        scores: { home: scoreHome, away: scoreAway },
        raw: item,
      };
    }
    // If this looks like API-SPORTS shape, reuse default normalization
    if (item && (item.fixture || item.game || item.match)) {
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

    const id = item.id || item.matchId || item.unique_id || null;
    const date = item.date || item.dateTimeGMT || item.matchStartTime || null;
    const status: string = item.status || item.ms || 'N/A';
    const leagueName = item.series || item.name || item.tournament || 'Cricket';
    const venue = item.venue || item.ground || null;

    let home = 'Home';
    let away = 'Away';
    
    // Handle team data for cricket API
    if (Array.isArray(item.teamInfo) && item.teamInfo.length >= 2) {
      home = item.teamInfo[0]?.shortname || item.teamInfo[0]?.name || home;
      away = item.teamInfo[1]?.shortname || item.teamInfo[1]?.name || away;
    } else if (Array.isArray(item.teams) && item.teams.length >= 2) {
      home = item.teams[0] || home;
      away = item.teams[1] || away;
    } else if (item.team1 && item.team2) {
      home = item.team1;
      away = item.team2;
    } else if (item.t1 && item.t2) {
      home = item.t1;
      away = item.t2;
    } else if (item.homeTeam && item.awayTeam) {
      home = item.homeTeam.name || item.homeTeam;
      away = item.awayTeam.name || item.awayTeam;
    }

    let scoreHome: number | null = null;
    let scoreAway: number | null = null;

    // Parse simple runs from CricAPI cricScore format like "123/4 (18.5)"
    const parseRuns = (s: any): number | null => {
      if (!s || typeof s !== 'string') return null;
      const m = s.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    };

    if (item.t1s || item.t2s) {
      scoreHome = parseRuns(item.t1s);
      scoreAway = parseRuns(item.t2s);
    } else if (Array.isArray(item.score)) {
      scoreHome = typeof item.score[0]?.r === 'number' ? item.score[0].r : scoreHome;
      scoreAway = typeof item.score[1]?.r === 'number' ? item.score[1].r : scoreAway;
    } else if (item.scores) {
      scoreHome = item.scores.home || item.scores.team1 || null;
      scoreAway = item.scores.away || item.scores.team2 || null;
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

  // Check if this is Sportmonks data (new API v3 structure)
  if (sport === 'football' && item.participants) {
    // Sportmonks API v3 normalization
    const home = item.participants?.find((p: any) => p.meta?.location === 'home');
    const away = item.participants?.find((p: any) => p.meta?.location === 'away');
    
    const statusMap: Record<string, string> = {
      'NS': 'Not Started',
      'TBA': 'To Be Announced',
      'POSTPONED': 'Postponed',
      'CANCELLED': 'Cancelled',
      'LIVE': 'Live',
      'HT': 'Half Time',
      'FT': 'Full Time',
      'AET': 'After Extra Time',
      'FT_PEN': 'Full Time (Penalties)',
      'ET': 'Extra Time',
      'BREAK': 'Break',
      'PEN_LIVE': 'Penalty Shootout'
    };
    
    return {
      sport,
      id: item.id || null,
      date: item.starting_at || null,
      league: item.league?.name || 'Unknown',
      venue: item.venue?.name || null,
      status: statusMap[item.state?.state] || item.state?.state || 'N/A',
      statusShort: item.state?.state,
      teams: { 
        home: home?.name || 'Home', 
        away: away?.name || 'Away' 
      },
      scores: { 
        home: item.scores?.find((s: any) => s.participant_id === home?.id)?.score?.goals || null,
        away: item.scores?.find((s: any) => s.participant_id === away?.id)?.score?.goals || null
      },
      raw: item,
    };
  }
  
  // Check if this is Sportmonks basketball data
  if (sport === 'basketball' && item.participants) {
    const home = item.participants?.find((p: any) => p.meta?.location === 'home');
    const away = item.participants?.find((p: any) => p.meta?.location === 'away');
    
    return {
      sport,
      id: item.id || null,
      date: item.starting_at || null,
      league: item.league?.name || 'Unknown',
      venue: item.venue?.name || null,
      status: item.state?.state || 'N/A',
      statusShort: item.state?.state,
      teams: { 
        home: home?.name || 'Home', 
        away: away?.name || 'Away' 
      },
      scores: { 
        home: item.scores?.find((s: any) => s.participant_id === home?.id)?.score?.points || null,
        away: item.scores?.find((s: any) => s.participant_id === away?.id)?.score?.points || null
      },
      raw: item,
    };
  }
  
  // Default (API-SPORTS hockey/other sports) normalization
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
  console.log('Sports-proxy function started, method:', req.method);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    const { sport, kind, date, team } = await req.json() as { sport?: string; kind?: Kind; date?: string | null; team?: string | null };

    const s = ensureSport(sport);
    const k = (kind || 'live') as Kind;
    const q = { date: date || undefined };

const url = buildUrl(s, k, q);
// For cricket, url may be empty when using API-SPORTS as primary; don't early-return
if (!url && s !== 'cricket') {
  return new Response(JSON.stringify({ sport: s, kind: k, count: 0, items: [] }), {
    headers: corsHeaders,
    status: 200,
  });
}
const key = `${s}:${k}:${q.date || 'any'}`;

    const data = await cached(key, ttlMsFor(k), async () => {
// Check for required API keys based on sport
if (s !== 'cricket' && !API_KEY) {
  const err: any = new Error('Sports API key not configured'); err.status = 500; throw err;
}
if (s === 'cricket' && !ENTITYSPORT_API_TOKEN && !SPORTMONKS_API_TOKEN && !API_KEY && !CRICAPI_KEY) {
  const err: any = new Error('No cricket provider keys configured'); err.status = 500; throw err;
}
      
      try {
// Set headers based on sport
const headers = s === 'cricket'
  ? { 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' } as Record<string, string>
  : { 'x-apisports-key': API_KEY, 'content-type': 'application/json', 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' } as Record<string, string>;

let normalized: any[] = [];

if (s === 'cricket') {
  // Try EntitySport first (priority provider)
  if (ENTITYSPORT_API_TOKEN) {
    try {
      const statusMap: Record<Kind, string> = { live: '1', upcoming: '2', results: '3' };
      const esUrl = new URL(`${ENTITYSPORT_BASE}/matches/`);
      esUrl.searchParams.set('token', ENTITYSPORT_API_TOKEN);
      esUrl.searchParams.set('status', statusMap[k]);
      esUrl.searchParams.set('per_page', '50');
      if (q.date) esUrl.searchParams.set('date', q.date);
      const masked = esUrl.toString().replace(/token=[^&]+/, 'token=***');
      console.log(`Fetching cricket (EntitySport) from: ${masked}`);
      const upstream = await doFetch(esUrl.toString());
      const list: any[] = upstream?.response?.items || upstream?.response || upstream?.data?.items || upstream?.data || upstream?.items || [];
      console.log(`cricket EntitySport raw response:`, JSON.stringify(upstream).slice(0, 500));
      console.log(`cricket EntitySport list length:`, list.length);
      if (list.length > 0) {
        const transformed = list.map((m: any) => ({
          id: m.match_id || m.eid || m.id,
          date: m.date_start_ist || m.date_start || m.timestamp_start || m.date || null,
          status: m.status_str || m.status || m.live_status || 'N/A',
          league: (m.competition && (m.competition.title || m.competition.name)) || (m.season && m.season.name) || m.tournament?.name || 'Cricket',
          venue: (m.venue && (m.venue.name || m.venue.venue)) || null,
          teamInfo: [
            { name: m.teama?.name || m.team_a?.name, shortname: m.teama?.short_name || m.team_a?.short_name },
            { name: m.teamb?.name || m.team_b?.name, shortname: m.teamb?.short_name || m.team_b?.short_name },
          ],
          t1s: m.teama_scores || m.team_a_scores,
          t2s: m.teamb_scores || m.team_b_scores,
        }));
        normalized = transformed.map((it: any) => normalizeItem(s, it));
        console.log(`cricket EntitySport normalized:`, normalized.length, 'items');
      }
    } catch (e) {
      console.log('EntitySport cricket fetch failed:', e);
    }
  }

  // Try SportMonks (v2) if no EntitySport data
  if (!normalized.length && SPORTMONKS_API_TOKEN) {
    const sportMonksUrl = (() => {
      const u = new URL('https://cricket.sportmonks.com/api/v2.0/fixtures');
      u.searchParams.set('api_token', SPORTMONKS_API_TOKEN);
      u.searchParams.set('include', 'localteam,visitorteam,league,venue,runs');
      return u.toString();
    })();

    try {
      console.log(`Fetching cricket (SportMonks) from: ${sportMonksUrl.replace(/api_token=[^&]+/, 'api_token=***')}`);
      const upstream = await doFetch(sportMonksUrl);
      const list: any[] = Array.isArray(upstream?.data) ? upstream.data : [];
      console.log(`cricket SportMonks list length:`, list.length);
      if (list.length > 0) {
        normalized = list.map((it) => normalizeItem(s, it));
        console.log(`cricket SportMonks normalized:`, normalized.length, 'items');
      }
    } catch (e) {
      console.log('SportMonks cricket fetch failed:', e);
    }
  }

  // Prefer API-SPORTS Cricket if no data yet
  if (!normalized.length) {
    const cricketFixturesUrl = (() => {
      const u = new URL(CRICKET_APISPORTS_BASE + '/fixtures');
      if (k === 'live') u.searchParams.set('live', 'all');
      else if (k === 'upcoming') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('next', '50'); }
      else if (k === 'results') { if (q.date) u.searchParams.set('date', q.date); else u.searchParams.set('last', '50'); }
      return u.toString();
    })();

    const apisportsHeaders: Record<string,string> = { 'x-apisports-key': API_KEY, 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' };
    try {
      console.log(`Fetching cricket (API-SPORTS) from: ${cricketFixturesUrl}`);
      const upstream = await doFetch(cricketFixturesUrl, apisportsHeaders);
      const list: any[] = upstream?.response || upstream?.results || upstream?.data || [];
      console.log(`cricket API-SPORTS list length:`, list.length);
      if (list.length > 0) {
        normalized = list.map((it) => normalizeItem(s, it));
        console.log(`cricket API-SPORTS normalized:`, normalized.length, 'items');
      }
    } catch (e) {
      console.log('API-SPORTS cricket fetch failed:', e);
    }
  }

  const cricapiHeaders: Record<string,string> = { 'accept': 'application/json', 'user-agent': 'supabase-edge/1.0' };
  // Fallback to CricAPI if API-SPORTS empty or failed
  if (!normalized.length) {
    const cricapiUrlMasked = url.replace(/apikey=[^&]+/, 'apikey=***');
    console.log(`Fetching cricket (CricAPI) from: ${cricapiUrlMasked}`);
    try {
      const upstream = await doFetch(url, cricapiHeaders);
      let list: any[] = [];
      if (Array.isArray(upstream?.data)) list = upstream.data;
      else if (Array.isArray(upstream)) list = upstream;
      else if (upstream && typeof upstream === 'object') list = upstream.data || [];

      console.log(`cricket CricAPI extracted list length:`, list.length);
      if (list.length > 0) {
        normalized = list.map((it) => normalizeItem(s, it));
        console.log(`cricket CricAPI normalized:`, normalized.length, 'items');
      }
    } catch (scoreApiError) {
      console.log(`cricScore API error:`, scoreApiError);
    }

    if (!normalized.length) {
      const fallbackUrls = getCricketFallbackUrls();
      for (const fallbackUrl of fallbackUrls) {
        try {
          console.log(`Trying fallback cricket API: ${fallbackUrl.replace(/apikey=[^&]+/,'apikey=***')}`);
          const upstream = await doFetch(fallbackUrl, cricapiHeaders);
          const list: any[] = upstream?.data || [];
          console.log(`cricket fallback list length:`, list.length);
          if (list.length > 0) {
            normalized = list.map((it) => normalizeItem(s, it));
            console.log(`cricket fallback normalized:`, normalized.length, 'items');
            break;
          }
        } catch (fallbackError) {
          console.log(`Fallback API failed:`, fallbackError);
          continue;
        }
      }
    }
  }

  // If absolutely no data, throw to trigger outer mock fallback
  if (!normalized.length) {
    console.log('No cricket data after API-SPORTS and CricAPI attempts; throwing to trigger mock');
    throw new Error('No cricket data');
  }
  
  // Filter cricket data based on kind - be more lenient with filtering
  if (k === 'upcoming') {
    const beforeFilter = normalized.length;
    normalized = normalized.filter((it) => {
      const sl = String(it.status || '').toLowerCase();
      return sl.includes('not started') || sl.includes('upcoming') || sl.includes('schedule') || sl.includes('fixture') || sl.includes('toss');
    });
    console.log(`${s} filtered ${beforeFilter} -> ${normalized.length} for upcoming`);
  } else if (k === 'results') {
    const beforeFilter = normalized.length;
    normalized = normalized.filter((it) => {
      const sl = String(it.status || '').toLowerCase();
      return sl.includes('won') || sl.includes('result') || sl.includes('completed') || sl.includes('draw') || sl.includes('tied') || sl.includes('abandoned') || sl.includes('finished');
    });
    console.log(`${s} filtered ${beforeFilter} -> ${normalized.length} for results`);
  } else if (k === 'live') {
    // For live, accept more status types
    const beforeFilter = normalized.length;
    normalized = normalized.filter((it) => {
      const sl = String(it.status || '').toLowerCase();
      return sl.includes('live') || sl.includes('in progress') || sl.includes('rain delay') || sl.includes('1st innings') || sl.includes('2nd innings') || sl.includes('batting') || sl.includes('bowling');
    });
    console.log(`${s} filtered ${beforeFilter} -> ${normalized.length} for live`);
  }
  console.log(`${s} after filtering for ${k}:`, normalized.length, 'items');
} else if (s === 'football') {
  // API-SPORTS football
  console.log(`Fetching ${s} data from: ${url}`);
  const upstream = await doFetch(url, headers);
  console.log(`${s} API response:`, JSON.stringify(upstream, null, 2));
  
  const list: any[] = upstream?.response || upstream?.results || upstream?.data || [];
  console.log(`${s} raw data list length:`, list.length);
  
  normalized = list.map((it) => normalizeItem(s, it));
  console.log(`${s} normalized data:`, normalized.length, 'items');
} else {
  // Other sports (hockey, basketball, etc.)
  console.log(`Fetching ${s} data from: ${url}`);
  const upstream = await doFetch(url, headers);
  console.log(`${s} API response:`, JSON.stringify(upstream, null, 2));
  
  const list: any[] = upstream?.response || upstream?.results || upstream?.data || [];
  console.log(`${s} raw data list length:`, list.length);
  
  normalized = list.map((it) => normalizeItem(s, it));
  console.log(`${s} normalized data:`, normalized.length, 'items');
}
        
        return normalized;
      } catch (error) {
        console.error(`Error fetching ${s} data:`, error);
        // Return empty array instead of mock data when API fails
        console.log(`Returning empty data for ${s} due to API error`);
        return [];
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
