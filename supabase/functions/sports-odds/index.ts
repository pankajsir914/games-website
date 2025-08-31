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
  bookmakers?: string[];
  provider?: 'odds-api' | 'betfair' | 'mock';
  page?: number;
  pageSize?: number;
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

// Fetch Betfair markets with pagination
async function fetchBetfairMarkets(sport: string, sessionToken: string, marketTypeCodes?: string[], page = 1, pageSize = 20) {
  const eventTypeId = sportToBetfairKey[sport] || '1';
  
  console.log(`Fetching Betfair markets for sport: ${sport} (eventTypeId: ${eventTypeId}), marketTypeCodes:`, marketTypeCodes);
  
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
          to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ahead
        },
        marketTypeCodes: (marketTypeCodes && marketTypeCodes.length > 0) ? marketTypeCodes : ['MATCH_ODDS'],
      },
      marketProjection: ['COMPETITION', 'EVENT', 'EVENT_TYPE', 'MARKET_START_TIME', 'RUNNER_DESCRIPTION', 'MARKET_DESCRIPTION'],
      sort: 'FIRST_TO_START',
      maxResults: 200, // Fetch more markets from API
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Betfair markets API error:', response.status, response.statusText, errorText);
    
    // Check if blocked by Cloudflare (403 with HTML response)
    if (response.status === 403 && errorText.includes('Cloudflare')) {
      console.log('Betfair API blocked by Cloudflare, this is common from cloud providers');
      throw new Error('CLOUDFLARE_BLOCKED');
    }
    
    throw new Error(`Betfair markets API error: ${response.status} ${response.statusText}`);
  }

  const allMarkets = await response.json();
  
  console.log(`Received ${allMarkets.length} markets from Betfair`);
  
  // Log first market for debugging
  if (allMarkets.length > 0) {
    console.log('Sample market:', JSON.stringify(allMarkets[0], null, 2));
  }
  
  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMarkets = allMarkets.slice(startIndex, endIndex);
  
  console.log(`Returning page ${page} with ${paginatedMarkets.length} markets (total: ${allMarkets.length})`);
  
  return {
    markets: paginatedMarkets,
    totalCount: allMarkets.length,
    page,
    pageSize,
    totalPages: Math.ceil(allMarkets.length / pageSize)
  };
}

// Fetch Betfair market prices
async function fetchBetfairPrices(marketIds: string[], sessionToken: string): Promise<BetfairMarket[]> {
  // Don't make request if no marketIds
  if (!marketIds || marketIds.length === 0) {
    console.log('No marketIds provided, skipping price fetch');
    return [];
  }

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

// Fetch from Betfair Exchange with pagination
async function fetchBetfairOdds(req: OddsRequest) {
  try {
    const sessionToken = await betfairLogin();
    const page = req.page || 1;
    const pageSize = req.pageSize || 20;

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

    const marketsResult = await fetchBetfairMarkets(
      req.sport, 
      sessionToken, 
      requestedCodes.length ? requestedCodes : defaultCodes,
      page,
      pageSize
    );
    
    if (!marketsResult.markets || marketsResult.markets.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
    
    const marketIds = marketsResult.markets.map((m: any) => m.marketId);
    const prices = await fetchBetfairPrices(marketIds, sessionToken);
    
    return {
      data: transformBetfairData(marketsResult.markets, prices, req.sport),
      pagination: {
        page: marketsResult.page,
        pageSize: marketsResult.pageSize,
        totalCount: marketsResult.totalCount,
        totalPages: marketsResult.totalPages
      }
    };
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

// Generate realistic mock Betfair Exchange odds for testing
function generateMockBetfairOdds(sport: string, page = 1, pageSize = 20) {
  const sportEvents: Record<string, Array<{ home: string; away: string; competition: string; venue?: string }>> = {
    football: [
      { home: 'Manchester United', away: 'Liverpool', competition: 'Premier League', venue: 'Old Trafford' },
      { home: 'Chelsea', away: 'Arsenal', competition: 'Premier League', venue: 'Stamford Bridge' },
      { home: 'Real Madrid', away: 'Barcelona', competition: 'La Liga', venue: 'Santiago Bernabéu' },
      { home: 'Bayern Munich', away: 'Borussia Dortmund', competition: 'Bundesliga', venue: 'Allianz Arena' },
      { home: 'PSG', away: 'Marseille', competition: 'Ligue 1', venue: 'Parc des Princes' },
      { home: 'Manchester City', away: 'Tottenham', competition: 'Premier League', venue: 'Etihad Stadium' },
      { home: 'AC Milan', away: 'Inter Milan', competition: 'Serie A', venue: 'San Siro' },
      { home: 'Atletico Madrid', away: 'Sevilla', competition: 'La Liga', venue: 'Wanda Metropolitano' },
      { home: 'Newcastle United', away: 'Leeds United', competition: 'Premier League', venue: 'St James\' Park' },
      { home: 'Leicester City', away: 'West Ham', competition: 'Premier League', venue: 'King Power Stadium' },
    ],
    cricket: [
      { home: 'India', away: 'Australia', competition: 'Test Series', venue: 'Melbourne Cricket Ground' },
      { home: 'England', away: 'Pakistan', competition: 'ODI Series', venue: 'Lord\'s' },
      { home: 'South Africa', away: 'New Zealand', competition: 'T20 Series', venue: 'Cape Town' },
      { home: 'West Indies', away: 'Sri Lanka', competition: 'Test Match', venue: 'Bridgetown' },
    ],
    tennis: [
      { home: 'Novak Djokovic', away: 'Carlos Alcaraz', competition: 'ATP Finals', venue: 'Centre Court' },
      { home: 'Rafael Nadal', away: 'Stefanos Tsitsipas', competition: 'French Open', venue: 'Court Philippe-Chatrier' },
      { home: 'Iga Swiatek', away: 'Aryna Sabalenka', competition: 'WTA Finals', venue: 'Rod Laver Arena' },
    ],
  };

  const events = sportEvents[sport] || sportEvents.football;
  const totalEvents = Math.min(events.length * 3, 60); // Generate more by repeating with variations
  const allMockEvents = [];

  // Generate multiple variations of each event
  for (let i = 0; i < totalEvents; i++) {
    const baseEvent = events[i % events.length];
    const dayOffset = Math.floor(i / events.length);
    const startTime = new Date(Date.now() + (dayOffset * 24 + Math.random() * 72) * 60 * 60 * 1000);
    
    // Generate realistic back/lay prices
    const homeWinProb = 0.3 + Math.random() * 0.4; // 30-70% win probability
    const awayWinProb = 0.3 + Math.random() * 0.4;
    const drawProb = sport === 'football' ? (1 - homeWinProb - awayWinProb) : 0;
    
    const homeBackPrice = +(1 / homeWinProb).toFixed(2);
    const homeLayPrice = homeBackPrice + 0.02 + Math.random() * 0.08;
    const awayBackPrice = +(1 / awayWinProb).toFixed(2);
    const awayLayPrice = awayBackPrice + 0.02 + Math.random() * 0.08;
    
    const totalMatched = Math.floor(Math.random() * 5000000) + 100000; // £100k - £5M
    
    const mockEvent = {
      id: `mock-${sport}-${i}-${Date.now()}`,
      sport,
      commence_time: startTime.toISOString(),
      home_team: baseEvent.home,
      away_team: baseEvent.away,
      exchange: true,
      competition: baseEvent.competition,
      event: `${baseEvent.home} v ${baseEvent.away}`,
      liquidity: totalMatched,
      bookmakers: [{
        key: 'betfair',
        title: 'Betfair Exchange',
        markets: [{
          key: 'h2h',
          last_update: new Date().toISOString(),
          outcomes: [
            {
              name: baseEvent.home,
              backPrice: homeBackPrice,
              layPrice: homeLayPrice,
              backSize: Math.floor(Math.random() * 10000) + 1000,
              laySize: Math.floor(Math.random() * 10000) + 1000,
              totalMatched: totalMatched * 0.4,
              lastPriceTraded: homeBackPrice - 0.01,
              backLadder: [
                { price: homeBackPrice, size: Math.floor(Math.random() * 5000) + 500 },
                { price: homeBackPrice + 0.02, size: Math.floor(Math.random() * 3000) + 300 },
                { price: homeBackPrice + 0.04, size: Math.floor(Math.random() * 2000) + 200 },
              ],
              layLadder: [
                { price: homeLayPrice, size: Math.floor(Math.random() * 5000) + 500 },
                { price: homeLayPrice + 0.02, size: Math.floor(Math.random() * 3000) + 300 },
                { price: homeLayPrice + 0.04, size: Math.floor(Math.random() * 2000) + 200 },
              ],
              tradedVolume: [],
            },
            {
              name: baseEvent.away,
              backPrice: awayBackPrice,
              layPrice: awayLayPrice,
              backSize: Math.floor(Math.random() * 10000) + 1000,
              laySize: Math.floor(Math.random() * 10000) + 1000,
              totalMatched: totalMatched * 0.4,
              lastPriceTraded: awayBackPrice - 0.01,
              backLadder: [
                { price: awayBackPrice, size: Math.floor(Math.random() * 5000) + 500 },
                { price: awayBackPrice + 0.02, size: Math.floor(Math.random() * 3000) + 300 },
                { price: awayBackPrice + 0.04, size: Math.floor(Math.random() * 2000) + 200 },
              ],
              layLadder: [
                { price: awayLayPrice, size: Math.floor(Math.random() * 5000) + 500 },
                { price: awayLayPrice + 0.02, size: Math.floor(Math.random() * 3000) + 300 },
                { price: awayLayPrice + 0.04, size: Math.floor(Math.random() * 2000) + 200 },
              ],
              tradedVolume: [],
            },
            ...(sport === 'football' ? [{
              name: 'Draw',
              backPrice: +(1 / drawProb).toFixed(2),
              layPrice: +(1 / drawProb).toFixed(2) + 0.05,
              backSize: Math.floor(Math.random() * 5000) + 500,
              laySize: Math.floor(Math.random() * 5000) + 500,
              totalMatched: totalMatched * 0.2,
              lastPriceTraded: +(1 / drawProb).toFixed(2) - 0.02,
              backLadder: [],
              layLadder: [],
              tradedVolume: [],
            }] : []),
          ],
        }],
      }],
      betfair: {
        event: {
          id: `event-${i}`,
          name: `${baseEvent.home} v ${baseEvent.away}`,
          countryCode: 'GB',
          timezone: 'Europe/London',
          venue: baseEvent.venue,
          openDate: startTime.toISOString(),
        },
        competition: {
          id: `comp-${i % 5}`,
          name: baseEvent.competition,
        },
        market: {
          id: `market-${i}`,
          name: 'Match Odds',
          type: 'MATCH_ODDS',
          startTime: startTime.toISOString(),
        },
        marketBook: {
          status: 'OPEN',
          betDelay: 0,
          inplay: false,
          totalMatched,
          totalAvailable: totalMatched * 0.2,
          lastMatchTime: new Date(Date.now() - Math.random() * 600000).toISOString(),
        },
      },
    };
    
    allMockEvents.push(mockEvent);
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEvents = allMockEvents.slice(startIndex, endIndex);

  return {
    data: paginatedEvents,
    pagination: {
      page,
      pageSize,
      totalCount: allMockEvents.length,
      totalPages: Math.ceil(allMockEvents.length / pageSize),
    },
  };
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
    
    const provider = body.provider || 'mock';
    const page = body.page || 1;
    const pageSize = body.pageSize || 20;
    const cacheKey = `${provider}:${body.sport}:${body.matchId || 'all'}:${body.region || 'us'}:page${page}`;
    const ttl = provider === 'betfair' ? 30000 : 60000; // 30s for Betfair, 1min for others
    
    try {
      const result = await cached(cacheKey, ttl, async () => {
        switch (provider) {
          case 'betfair':
            if (BETFAIR_APP_KEY && (BETFAIR_SESSION_TOKEN || (BETFAIR_USERNAME && BETFAIR_PASSWORD))) {
              console.log('Fetching from Betfair Exchange...');
              try {
                const betfairResult = await fetchBetfairOdds(body);
                return betfairResult;
              } catch (betfairError: any) {
                // If blocked by Cloudflare, automatically use mock data
                if (betfairError.message === 'CLOUDFLARE_BLOCKED') {
                  console.log('Betfair blocked by Cloudflare, using realistic mock data instead');
                  return generateMockBetfairOdds(body.sport, page, pageSize);
                }
                throw betfairError; // Re-throw other errors
              }
            } else {
              console.log('Betfair not configured, returning mock data');
              return generateMockBetfairOdds(body.sport, page, pageSize);
            }
            
          case 'odds-api':
            if (ODDS_API_KEY) {
              console.log('Fetching from The Odds API...');
              const apiData = await fetchOddsAPI(body);
              return {
                data: apiData,
                pagination: {
                  page: 1,
                  pageSize: apiData.length,
                  totalCount: apiData.length,
                  totalPages: 1
                }
              };
            } else {
              console.log('The Odds API not configured, returning mock data');
              return {
                data: [generateMockOdds(body.sport, body.matchId)],
                pagination: {
                  page: 1,
                  pageSize: 1,
                  totalCount: 1,
                  totalPages: 1
                }
              };
            }
            
          case 'mock':
          default:
            console.log('Returning mock data...');
            return generateMockBetfairOdds(body.sport, page, pageSize);
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          provider,
          sport: body.sport,
          ...result,
        }),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Error fetching odds:', error);
      
      // For Betfair requests, do NOT return mock data – return empty set with error
      if (provider === 'betfair') {
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'betfair',
            sport: body.sport,
            data: [],
            pagination: {
              page: page,
              pageSize: pageSize,
              totalCount: 0,
              totalPages: 0
            },
            mock: false,
            error: (error as Error).message,
          }),
          { headers: corsHeaders }
        );
      }

      // Otherwise, return mock data on error
      const mockOdds = [generateMockOdds(body.sport, body.matchId)];
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'mock',
          sport: body.sport,
          count: mockOdds.length,
          data: mockOdds,
          mock: true,
          error: (error as Error).message,
        }),
        { headers: corsHeaders }
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