// Supabase Edge Function: sports-odds
// Fetches betting odds for sports matches from odds providers
// Integrates with The Odds API, Betfair Exchange, and other betting odds services

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// API Keys and Configuration
const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY') || '';
const BETFAIR_APP_KEY = Deno.env.get('BETFAIR_APP_KEY') || '';
const BETFAIR_USERNAME = Deno.env.get('BETFAIR_USERNAME') || '';
const BETFAIR_PASSWORD = Deno.env.get('BETFAIR_PASSWORD') || '';
const BETFAIR_SESSION_TOKEN = Deno.env.get('BETFAIR_SESSION_TOKEN') || '';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const BETFAIR_LOGIN_URL = 'https://identitysso.betfair.com/api/login';
const BETFAIR_API_BASE = 'https://api.betfair.com/exchange/betting/rest/v1.0';

console.log('API Configuration:', {
  oddsApi: ODDS_API_KEY ? 'configured' : 'missing',
  betfair: BETFAIR_APP_KEY ? 'configured' : 'missing'
});

// Cache for odds data and Betfair session
const cache = new Map<string, { expires: number; data: any }>();
let betfairSessionToken: string | null = null;
let betfairSessionExpires: number = 0;

interface OddsRequest {
  sport: string;
  matchId?: string;
  region?: string;
  markets?: string[];
  provider?: 'odds-api' | 'rapidapi';
}

interface BetfairMarket {
  marketId: string;
  marketName: string;
  totalMatched: number;
  runners: Array<{
    selectionId: number;
    runnerName: string;
    handicap: number;
    status: string;
    lastPriceTraded?: number;
    totalMatched?: number;
    availableToBack?: Array<{ price: number; size: number }>;
    availableToLay?: Array<{ price: number; size: number }>;
  }>;
}

// Map sport names to API sport keys
const sportToOddsKey: Record<string, string> = {
  'football': 'soccer_epl',
  'basketball': 'basketball_nba',
  'baseball': 'baseball_mlb',
  'tennis': 'tennis_atp_french_open',
  'hockey': 'icehockey_nhl',
  'cricket': 'cricket_test_match',
};

const sportToBetfairKey: Record<string, string> = {
  'football': '1',
  'tennis': '2',
  'cricket': '4',
  'horse-racing': '7',
  'basketball': '7522',
  'baseball': '7511',
};

// Betfair authentication with session token fallback
async function betfairLogin(): Promise<string> {
  // Use provided session token if available
  if (BETFAIR_SESSION_TOKEN) {
    console.log('Using provided Betfair session token...');
    betfairSessionToken = BETFAIR_SESSION_TOKEN;
    betfairSessionExpires = Date.now() + (3600000 * 4); // 4 hours
    return betfairSessionToken;
  }

  // Use cached session if still valid
  if (betfairSessionToken && betfairSessionExpires > Date.now()) {
    return betfairSessionToken;
  }

  // Fall back to login if username/password available
  if (BETFAIR_USERNAME && BETFAIR_PASSWORD) {
    console.log('Attempting Betfair login...');

    const response = await fetch(BETFAIR_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Application': BETFAIR_APP_KEY,
      },
      body: new URLSearchParams({
        username: BETFAIR_USERNAME,
        password: BETFAIR_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Betfair login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'SUCCESS') {
      throw new Error(`Betfair login failed: ${data.error || 'Unknown error'}`);
    }

    betfairSessionToken = data.token;
    betfairSessionExpires = Date.now() + (3600000 * 4); // 4 hours
    
    console.log('Betfair login successful');
    return betfairSessionToken;
  }

  throw new Error('No Betfair authentication credentials available');
}

// Fetch Betfair markets
async function fetchBetfairMarkets(sport: string, sessionToken: string, marketTypeCodes?: string[]) {
  const eventTypeId = sportToBetfairKey[sport] || '1';
  
  const response = await fetch(`${BETFAIR_API_BASE}/listMarketCatalogue/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Application': BETFAIR_APP_KEY,
      'X-Authentication': sessionToken,
    },
    body: JSON.stringify({
      filter: {
        eventTypeIds: [eventTypeId],
        marketStartTime: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        marketTypeCodes: (marketTypeCodes && marketTypeCodes.length > 0) ? marketTypeCodes : ['MATCH_ODDS'],
      },
      marketProjection: ['COMPETITION', 'EVENT', 'EVENT_TYPE', 'MARKET_START_TIME', 'RUNNER_DESCRIPTION', 'MARKET_DESCRIPTION'],
      sort: 'FIRST_TO_START',
      maxResults: 12,
    }),
  });

  if (!response.ok) {
    throw new Error(`Betfair API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Fetch Betfair market prices
async function fetchBetfairPrices(marketIds: string[], sessionToken: string): Promise<BetfairMarket[]> {
  const response = await fetch(`${BETFAIR_API_BASE}/listMarketBook/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Application': BETFAIR_APP_KEY,
      'X-Authentication': sessionToken,
    },
    body: JSON.stringify({
      marketIds: marketIds,
      priceProjection: {
        priceData: ['EX_BEST_OFFERS', 'EX_TRADED'],
        exBestOffersOverrides: { bestPricesDepth: 3 },
        virtualise: false,
        rolloverStakes: false,
      },
      currencyCode: 'GBP',
      locale: 'en',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Betfair prices API error:', errorText);
    throw new Error(`Betfair prices API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Betfair prices response sample:', JSON.stringify(data[0], null, 2));
  return data;
}

// Transform Betfair data to match our interface
function transformBetfairData(markets: any[], prices: any[], sport: string) {
  console.log('Transforming Betfair data, markets count:', markets.length, 'prices count:', prices.length);
  
  return markets.map((market: any) => {
    const marketPrice = prices.find((p: any) => p.marketId === market.marketId);
    
    // Calculate total liquidity from the market-level totalMatched
    const marketLiquidity = marketPrice?.totalMatched || 0;
    
    // Also sum runner-level liquidity if available
    const runnerLiquidity = marketPrice?.runners?.reduce((sum: number, r: any) => {
      return sum + (r.totalMatched || 0);
    }, 0) || 0;
    
    // Use the higher of the two values
    const totalLiquidity = Math.max(marketLiquidity, runnerLiquidity);
    
    console.log(`Market ${market.marketId}: marketLiquidity=${marketLiquidity}, runnerLiquidity=${runnerLiquidity}`);
    
    return {
      id: market.marketId,
      sport,
      commence_time: market.marketStartTime,
      home_team: market.runners?.[0]?.runnerName || market.event?.name?.split(' v ')?.[0] || 'Home',
      away_team: market.runners?.[1]?.runnerName || market.event?.name?.split(' v ')?.[1] || 'Away',
      exchange: true,
      bookmakers: [{
        key: 'betfair',
        title: 'Betfair Exchange',
        markets: [{
          key: market.marketName === 'Match Odds' ? 'h2h' : (market.marketName || 'market').toLowerCase().replace(/\s+/g, '_'),
          last_update: new Date().toISOString(),
          outcomes: (marketPrice?.runners || []).map((runner: any, idx: number) => ({
            name: runner.runnerName || market.runners?.[idx]?.runnerName || `Runner ${idx + 1}`,
            backPrice: runner.ex?.availableToBack?.[0]?.price ?? null,
            layPrice: runner.ex?.availableToLay?.[0]?.price ?? null,
            backSize: runner.ex?.availableToBack?.[0]?.size ?? 0,
            laySize: runner.ex?.availableToLay?.[0]?.size ?? 0,
            totalMatched: runner.totalMatched ?? 0,
            lastPriceTraded: runner.lastPriceTraded ?? null,
            backLadder: runner.ex?.availableToBack || [],
            layLadder: runner.ex?.availableToLay || [],
            tradedVolume: runner.ex?.tradedVolume || [],
          })),
        }],
      }],
      liquidity: totalLiquidity,
      competition: market.competition?.name || 'Unknown',
      event: market.event?.name || 'Unknown Event',
      betfair: {
        event: {
          id: market.event?.id,
          name: market.event?.name,
          countryCode: market.event?.countryCode,
          timezone: market.event?.timezone,
          venue: market.event?.venue,
          openDate: market.event?.openDate,
        },
        competition: {
          id: market.competition?.id,
          name: market.competition?.name,
        },
        market: {
          id: market.marketId,
          name: market.marketName,
          type: market.description?.marketType,
          startTime: market.marketStartTime,
        },
        marketBook: marketPrice ? {
          status: marketPrice.status,
          betDelay: marketPrice.betDelay,
          inplay: marketPrice.inplay,
          totalMatched: marketPrice.totalMatched,
          totalAvailable: marketPrice.totalAvailable,
          lastMatchTime: marketPrice.lastMatchTime,
        } : null,
      },
    };
  });
}

// Fetch from Betfair Exchange
async function fetchBetfairOdds(req: OddsRequest) {
  try {
    const sessionToken = await betfairLogin();

    // Map requested markets to Betfair marketTypeCodes when possible
    const defaultCodes = ['MATCH_ODDS'];
    const mapToBetfair: Record<string, string> = {
      h2h: 'MATCH_ODDS',
      totals: 'OVER_UNDER_25',
      spreads: 'ASIAN_HANDICAP',
    };
    const requestedCodes = (req.markets || [])
      .map(m => mapToBetfair[m as keyof typeof mapToBetfair] || (m === m.toUpperCase() ? m : ''))
      .filter((m): m is string => !!m);

    const markets = await fetchBetfairMarkets(req.sport, sessionToken, requestedCodes.length ? requestedCodes : defaultCodes);
    
    if (!markets || markets.length === 0) {
      return [];
    }
    
    const marketIds = markets.slice(0, 10).map((m: any) => m.marketId);
    const prices = await fetchBetfairPrices(marketIds, sessionToken);
    
    return transformBetfairData(markets.slice(0, 10), prices, req.sport);
  } catch (error) {
    console.error('Betfair API error:', error);
    throw error;
  }
}

// Fetch from The Odds API
async function fetchOddsAPI(req: OddsRequest) {
  const sportKey = sportToOddsKey[req.sport] || req.sport;
  const region = req.region || 'us';
  const markets = req.markets?.join(',') || 'h2h,spreads,totals';
  
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


// Cache helper
async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { expires: now + ttlMs, data });
  return data;
}

// Main handler
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
    
    const provider = body.provider || 'odds-api';
    const cacheKey = `${provider}:${body.sport}:${body.matchId || 'all'}:${body.region || 'us'}`;
    const ttl = provider === 'betfair' ? 30000 : 60000; // 30s for Betfair, 1min for others
    
    try {
      const odds = await cached(cacheKey, ttl, async () => {
        switch (provider) {
          case 'odds-api':
            if (ODDS_API_KEY) {
              console.log('Fetching from The Odds API...');
              return await fetchOddsAPI(body);
            } else {
              console.log('The Odds API not configured');
              return [];
            }
            
          default:
            console.log('No valid provider specified');
            return [];
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          provider,
          sport: body.sport,
          count: odds.length,
          data: odds,
        }),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Error fetching odds:', error);
      
      
      // Return error on API failure  
      return new Response(
        JSON.stringify({
          success: false,
          provider: provider,
          sport: body.sport,
          count: 0,
          data: [],
          error: (error as Error).message,
        }),
        { headers: corsHeaders, status: 500 }
      );
    }
  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});