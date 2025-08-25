// Supabase Edge Function: sports-odds
// Fetches betting odds for sports matches from odds providers
// Integrates with The Odds API or other betting odds services

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY') || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Cache for odds data
const cache = new Map<string, { expires: number; data: any }>();

interface OddsRequest {
  sport: string;
  matchId?: string;
  region?: string;
  markets?: string[];
  bookmakers?: string[];
}

// Map sport names to The Odds API sport keys
const sportToOddsKey: Record<string, string> = {
  'football': 'soccer_epl',  // Default to Premier League, can be expanded
  'basketball': 'basketball_nba',
  'baseball': 'baseball_mlb',
  'tennis': 'tennis_atp_french_open',
  'hockey': 'icehockey_nhl',
  'cricket': 'cricket_test_match',
};

async function fetchOdds(req: OddsRequest) {
  const sportKey = sportToOddsKey[req.sport] || req.sport;
  const region = req.region || 'us';
  const markets = req.markets?.join(',') || 'h2h,spreads,totals';
  
  // Build URL for The Odds API
  const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/odds`);
  url.searchParams.set('apiKey', ODDS_API_KEY);
  url.searchParams.set('regions', region);
  url.searchParams.set('markets', markets);
  
  if (req.bookmakers && req.bookmakers.length > 0) {
    url.searchParams.set('bookmakers', req.bookmakers.join(','));
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Transform and normalize odds data
  return data.map((event: any) => ({
    id: event.id,
    sport: req.sport,
    commence_time: event.commence_time,
    home_team: event.home_team,
    away_team: event.away_team,
    bookmakers: event.bookmakers?.map((bookmaker: any) => ({
      key: bookmaker.key,
      title: bookmaker.title,
      markets: bookmaker.markets?.map((market: any) => ({
        key: market.key,
        last_update: market.last_update,
        outcomes: market.outcomes?.map((outcome: any) => ({
          name: outcome.name,
          price: outcome.price,
          point: outcome.point,
        })),
      })),
    })),
  }));
}

// Alternative mock odds generator for development/testing
function generateMockOdds(sport: string, matchId?: string) {
  const bookmakers = ['bet365', 'william_hill', 'betfair', 'unibet'];
  
  return {
    matchId: matchId || `mock-${Date.now()}`,
    sport,
    odds: {
      h2h: bookmakers.map(bm => ({
        bookmaker: bm,
        home: (Math.random() * 2 + 1.5).toFixed(2),
        away: (Math.random() * 2 + 1.5).toFixed(2),
        draw: sport === 'football' ? (Math.random() * 1.5 + 2.5).toFixed(2) : null,
      })),
      spreads: bookmakers.map(bm => ({
        bookmaker: bm,
        home: {
          points: (Math.random() * 10 - 5).toFixed(1),
          odds: (Math.random() * 0.4 + 1.7).toFixed(2),
        },
        away: {
          points: (Math.random() * 10 - 5).toFixed(1),
          odds: (Math.random() * 0.4 + 1.7).toFixed(2),
        },
      })),
      totals: bookmakers.map(bm => ({
        bookmaker: bm,
        points: (Math.random() * 100 + 150).toFixed(1),
        over: (Math.random() * 0.4 + 1.7).toFixed(2),
        under: (Math.random() * 0.4 + 1.7).toFixed(2),
      })),
    },
    lastUpdate: new Date().toISOString(),
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }
    
    const body = await req.json() as OddsRequest;
    
    if (!body.sport) {
      return new Response(
        JSON.stringify({ error: 'Sport is required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const cacheKey = `${body.sport}:${body.matchId || 'all'}:${body.region || 'us'}`;
    const ttl = 60000; // 1 minute cache
    
    try {
      const odds = await cached(cacheKey, ttl, async () => {
        if (ODDS_API_KEY) {
          // Fetch real odds from The Odds API
          return await fetchOdds(body);
        } else {
          // Return mock odds if no API key configured
          console.log('No Odds API key configured, returning mock data');
          return [generateMockOdds(body.sport, body.matchId)];
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          sport: body.sport,
          count: odds.length,
          data: odds,
        }),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Error fetching odds:', error);
      
      // Return mock data on error
      const mockOdds = [generateMockOdds(body.sport, body.matchId)];
      
      return new Response(
        JSON.stringify({
          success: true,
          sport: body.sport,
          count: mockOdds.length,
          data: mockOdds,
          mock: true,
        }),
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});