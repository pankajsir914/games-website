import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RapidAPI configuration
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';

// API hosts for different sports
const RAPIDAPI_HOSTS = {
  football: 'api-football-v1.p.rapidapi.com',
  cricket: 'cricket-live-data.p.rapidapi.com',
  basketball: 'api-basketball.p.rapidapi.com',
  tennis: 'tennis-live-data.p.rapidapi.com',
  hockey: 'ice-hockey-live-data.p.rapidapi.com',
  odds: 'odds.p.rapidapi.com'
};

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();

// Cache TTL based on data type
const getCacheTTL = (type: string) => {
  switch (type) {
    case 'live': return 30 * 1000; // 30 seconds
    case 'upcoming': return 5 * 60 * 1000; // 5 minutes
    case 'results': return 30 * 60 * 1000; // 30 minutes
    default: return 60 * 1000; // 1 minute
  }
};

// Generic cache function
async function getCached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < ttl) {
    console.log(`Cache hit for ${key}`);
    return cached.data;
  }
  
  console.log(`Cache miss for ${key}, fetching...`);
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

// Fetch data from RapidAPI
async function fetchFromRapidAPI(sport: string, endpoint: string, params: Record<string, string> = {}) {
  const host = RAPIDAPI_HOSTS[sport as keyof typeof RAPIDAPI_HOSTS];
  if (!host) {
    throw new Error(`Unsupported sport: ${sport}`);
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://${host}/${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`Fetching from RapidAPI: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': host
    }
  });

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Transform football data to standard format
function transformFootballData(data: any, type: string): any[] {
  const fixtures = data.response || [];
  
  return fixtures.map((fixture: any) => ({
    id: fixture.fixture?.id?.toString() || '',
    sport: 'football',
    date: fixture.fixture?.date || '',
    league: fixture.league?.name || '',
    venue: fixture.fixture?.venue?.name || '',
    status: fixture.fixture?.status?.long || '',
    teams: {
      home: fixture.teams?.home?.name || '',
      away: fixture.teams?.away?.name || '',
    },
    scores: {
      home: fixture.goals?.home ?? null,
      away: fixture.goals?.away ?? null,
    },
    raw: fixture
  }));
}

// Transform cricket data to standard format
function transformCricketData(data: any, type: string): any[] {
  const matches = data.data || data.matches || [];
  
  return matches.map((match: any) => ({
    id: match.id?.toString() || '',
    sport: 'cricket',
    date: match.dateTimeGMT || match.date || '',
    league: match.series?.name || match.series_name || '',
    venue: match.venue || '',
    status: match.status || '',
    teams: {
      home: match.teamInfo?.[0]?.name || match.teams?.[0] || '',
      away: match.teamInfo?.[1]?.name || match.teams?.[1] || '',
    },
    scores: {
      home: match.score?.[0]?.r ?? null,
      away: match.score?.[1]?.r ?? null,
    },
    overs: {
      home: match.score?.[0]?.o?.toString() || '0',
      away: match.score?.[1]?.o?.toString() || '0',
    },
    wickets: {
      home: match.score?.[0]?.w ?? 0,
      away: match.score?.[1]?.w ?? 0,
    },
    raw: match
  }));
}

// Transform basketball data to standard format
function transformBasketballData(data: any, type: string): any[] {
  const games = data.response || [];
  
  return games.map((game: any) => ({
    id: game.id?.toString() || '',
    sport: 'basketball',
    date: game.date || '',
    league: game.league?.name || '',
    venue: game.venue || '',
    status: game.status?.long || '',
    teams: {
      home: game.teams?.home?.name || '',
      away: game.teams?.away?.name || '',
    },
    scores: {
      home: game.scores?.home?.total ?? null,
      away: game.scores?.away?.total ?? null,
    },
    quarters: {
      home: game.scores?.home?.quarter_1 ?? null,
      away: game.scores?.away?.quarter_1 ?? null,
    },
    raw: game
  }));
}

// Transform tennis data to standard format
function transformTennisData(data: any, type: string): any[] {
  const matches = data.results || [];
  
  return matches.map((match: any) => ({
    id: match.id?.toString() || '',
    sport: 'tennis',
    date: match.date || '',
    league: match.tournament?.name || '',
    venue: match.venue || '',
    status: match.status || '',
    teams: {
      home: match.home?.name || '',
      away: match.away?.name || '',
    },
    scores: {
      home: match.home_score ?? null,
      away: match.away_score ?? null,
    },
    sets: {
      home: match.home?.sets ?? [],
      away: match.away?.sets ?? [],
    },
    raw: match
  }));
}

// Transform hockey data to standard format
function transformHockeyData(data: any, type: string): any[] {
  const games = data.games || [];
  
  return games.map((game: any) => ({
    id: game.id?.toString() || '',
    sport: 'hockey',
    date: game.startTime || '',
    league: game.league?.name || '',
    venue: game.venue?.name || '',
    status: game.status || '',
    teams: {
      home: game.homeTeam?.name || '',
      away: game.awayTeam?.name || '',
    },
    scores: {
      home: game.homeScore ?? null,
      away: game.awayScore ?? null,
    },
    periods: game.periods || [],
    raw: game
  }));
}

// Get appropriate endpoint and transform function for each sport
function getEndpointConfig(sport: string, type: string) {
  const configs: Record<string, any> = {
    football: {
      live: { endpoint: 'fixtures', params: { live: 'all' }, transform: transformFootballData },
      upcoming: { endpoint: 'fixtures', params: { next: '20' }, transform: transformFootballData },
      results: { endpoint: 'fixtures', params: { last: '20' }, transform: transformFootballData }
    },
    cricket: {
      live: { endpoint: 'matches/live', params: {}, transform: transformCricketData },
      upcoming: { endpoint: 'matches/upcoming', params: {}, transform: transformCricketData },
      results: { endpoint: 'matches/recent', params: {}, transform: transformCricketData }
    },
    basketball: {
      live: { endpoint: 'games', params: { live: 'all' }, transform: transformBasketballData },
      upcoming: { endpoint: 'games', params: { date: new Date().toISOString().split('T')[0] }, transform: transformBasketballData },
      results: { endpoint: 'games', params: { date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }, transform: transformBasketballData }
    },
    tennis: {
      live: { endpoint: 'matches/live', params: {}, transform: transformTennisData },
      upcoming: { endpoint: 'matches/upcoming', params: {}, transform: transformTennisData },
      results: { endpoint: 'matches/results', params: {}, transform: transformTennisData }
    },
    hockey: {
      live: { endpoint: 'games/live', params: {}, transform: transformHockeyData },
      upcoming: { endpoint: 'games/upcoming', params: {}, transform: transformHockeyData },
      results: { endpoint: 'games/recent', params: {}, transform: transformHockeyData }
    }
  };

  return configs[sport]?.[type] || null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    let sport = 'football';
    let type = 'live';
    
    // Try to parse the body
    if (bodyText) {
      try {
        const body = JSON.parse(bodyText);
        sport = body.sport || 'football';
        type = body.type || 'live';
      } catch (e) {
        // If parsing fails, try URL params
        const url = new URL(req.url);
        sport = url.searchParams.get('sport') || 'football';
        type = url.searchParams.get('type') || 'live';
      }
    }

    // Check if RapidAPI key is configured
    if (!RAPIDAPI_KEY) {
      console.error('RapidAPI key not configured');
      // Return mock data if no key
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'mock',
          sport,
          type,
          data: generateMockData(sport, type),
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get endpoint configuration
    const config = getEndpointConfig(sport, type);
    if (!config) {
      throw new Error(`Invalid sport or type: ${sport}/${type}`);
    }

    // Fetch data with caching
    const cacheKey = `${sport}-${type}`;
    const ttl = getCacheTTL(type);
    
    const data = await getCached(
      cacheKey,
      ttl,
      async () => {
        const apiData = await fetchFromRapidAPI(sport, config.endpoint, config.params);
        return config.transform(apiData, type);
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        provider: 'rapidapi',
        sport,
        type,
        data,
        cached: cache.has(cacheKey)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sports-rapidapi:', error);
    
    // Return mock data on error
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'football';
    const type = url.searchParams.get('type') || 'live';
    
    return new Response(
      JSON.stringify({
        success: true,
        provider: 'mock',
        sport,
        type,
        data: generateMockData(sport, type),
        error: error.message,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate mock data for testing
function generateMockData(sport: string, type: string) {
  const mockTeams = {
    football: [
      { home: 'Manchester United', away: 'Liverpool FC' },
      { home: 'Real Madrid', away: 'Barcelona' },
      { home: 'Bayern Munich', away: 'Borussia Dortmund' }
    ],
    cricket: [
      { home: 'India', away: 'Australia' },
      { home: 'England', away: 'Pakistan' },
      { home: 'South Africa', away: 'New Zealand' }
    ],
    basketball: [
      { home: 'Lakers', away: 'Warriors' },
      { home: 'Nets', away: 'Celtics' },
      { home: 'Bulls', away: 'Heat' }
    ],
    tennis: [
      { home: 'Djokovic', away: 'Nadal' },
      { home: 'Federer', away: 'Murray' },
      { home: 'Alcaraz', away: 'Medvedev' }
    ],
    hockey: [
      { home: 'Rangers', away: 'Devils' },
      { home: 'Maple Leafs', away: 'Canadiens' },
      { home: 'Penguins', away: 'Capitals' }
    ]
  };

  const teams = mockTeams[sport as keyof typeof mockTeams] || mockTeams.football;
  
  return teams.map((team, index) => ({
    id: `mock-${sport}-${index}`,
    sport,
    date: new Date(Date.now() + index * 3600000).toISOString(),
    league: `${sport.charAt(0).toUpperCase() + sport.slice(1)} League`,
    venue: 'Stadium ' + (index + 1),
    status: type === 'live' ? 'In Progress' : type === 'upcoming' ? 'Scheduled' : 'Finished',
    teams: team,
    scores: type === 'results' ? {
      home: Math.floor(Math.random() * 5),
      away: Math.floor(Math.random() * 5)
    } : { home: null, away: null },
    raw: {}
  }));
}