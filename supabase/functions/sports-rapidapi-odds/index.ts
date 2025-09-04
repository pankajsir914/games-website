import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RapidAPI configuration
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';

// Cache for odds data
const oddsCache = new Map<string, { data: any; timestamp: number }>();

// Transform RapidAPI odds to our format
function transformOddsData(data: any, sport: string): any[] {
  const events = data.response || data.events || data.data || [];
  
  return events.map((event: any) => {
    const h2hOdds: any[] = [];
    const spreadOdds: any[] = [];
    const totalOdds: any[] = [];
    
    // Extract bookmaker odds
    if (event.bookmakers) {
      event.bookmakers.forEach((bookmaker: any) => {
        const bookmakerName = bookmaker.name;
        
        bookmaker.bets?.forEach((bet: any) => {
          if (bet.name === 'Match Winner' || bet.name === 'Home/Away') {
            const homeOdd = bet.values?.find((v: any) => v.value === 'Home')?.odd;
            const awayOdd = bet.values?.find((v: any) => v.value === 'Away')?.odd;
            const drawOdd = bet.values?.find((v: any) => v.value === 'Draw')?.odd;
            
            if (homeOdd && awayOdd) {
              h2hOdds.push({
                bookmaker: bookmakerName,
                home: homeOdd,
                away: awayOdd,
                draw: drawOdd || null
              });
            }
          } else if (bet.name === 'Handicap' || bet.name === 'Asian Handicap') {
            bet.values?.forEach((value: any) => {
              if (value.handicap) {
                spreadOdds.push({
                  bookmaker: bookmakerName,
                  home: { points: value.handicap, odds: value.odd },
                  away: { points: (-parseFloat(value.handicap)).toString(), odds: value.odd }
                });
              }
            });
          } else if (bet.name === 'Goals Over/Under' || bet.name === 'Total') {
            bet.values?.forEach((value: any) => {
              if (value.value?.includes('Over')) {
                const points = value.value.replace('Over ', '');
                totalOdds.push({
                  bookmaker: bookmakerName,
                  points,
                  over: value.odd,
                  under: bet.values?.find((v: any) => v.value === `Under ${points}`)?.odd || '0'
                });
              }
            });
          }
        });
      });
    }
    
    return {
      matchId: event.fixture?.id || event.id || `${sport}-${Date.now()}`,
      sport,
      home_team: event.teams?.home?.name || event.home_team || 'Home Team',
      away_team: event.teams?.away?.name || event.away_team || 'Away Team',
      competition: event.league?.name || event.competition || 'League',
      event: `${event.teams?.home?.name || 'Home'} vs ${event.teams?.away?.name || 'Away'}`,
      bookmakers: event.bookmakers?.map((b: any) => ({
        key: b.id || b.name,
        title: b.name,
        markets: b.bets?.map((bet: any) => ({
          key: bet.id || bet.name,
          last_update: event.update || new Date().toISOString(),
          outcomes: bet.values?.map((v: any) => ({
            name: v.value,
            price: parseFloat(v.odd),
            point: v.handicap ? parseFloat(v.handicap) : undefined
          })) || []
        })) || []
      })) || [],
      odds: {
        h2h: h2hOdds.length > 0 ? h2hOdds : undefined,
        spreads: spreadOdds.length > 0 ? spreadOdds : undefined,
        totals: totalOdds.length > 0 ? totalOdds : undefined
      },
      lastUpdate: event.update || new Date().toISOString(),
      mock: false
    };
  });
}

// Generate mock odds for testing
function generateMockOdds(sport: string, matchId?: string) {
  const teams = {
    football: [
      { home: 'Manchester United', away: 'Liverpool' },
      { home: 'Real Madrid', away: 'Barcelona' }
    ],
    cricket: [
      { home: 'India', away: 'Australia' },
      { home: 'England', away: 'Pakistan' }
    ],
    basketball: [
      { home: 'Lakers', away: 'Warriors' },
      { home: 'Celtics', away: 'Heat' }
    ]
  };

  const selectedTeams = teams[sport as keyof typeof teams] || teams.football;
  const team = selectedTeams[Math.floor(Math.random() * selectedTeams.length)];

  return [{
    matchId: matchId || `mock-${sport}-${Date.now()}`,
    sport,
    home_team: team.home,
    away_team: team.away,
    competition: `${sport.charAt(0).toUpperCase() + sport.slice(1)} League`,
    event: `${team.home} vs ${team.away}`,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: team.home, price: 2.5 },
              { name: team.away, price: 3.0 },
              { name: 'Draw', price: 3.2 }
            ]
          }
        ]
      },
      {
        key: 'william_hill',
        title: 'William Hill',
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: team.home, price: 2.45 },
              { name: team.away, price: 3.1 },
              { name: 'Draw', price: 3.25 }
            ]
          }
        ]
      }
    ],
    odds: {
      h2h: [
        { bookmaker: 'Bet365', home: '2.50', away: '3.00', draw: '3.20' },
        { bookmaker: 'William Hill', home: '2.45', away: '3.10', draw: '3.25' }
      ],
      spreads: [
        { bookmaker: 'Bet365', home: { points: '-1.5', odds: '1.90' }, away: { points: '+1.5', odds: '1.90' } }
      ],
      totals: [
        { bookmaker: 'Bet365', points: '2.5', over: '1.85', under: '1.95' }
      ]
    },
    lastUpdate: new Date().toISOString(),
    mock: true
  }];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport, matchId, region, markets } = await req.json();
    
    // Check if RapidAPI key is configured
    if (!RAPIDAPI_KEY) {
      console.log('RapidAPI key not configured, returning mock data');
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'mock',
          sport,
          data: generateMockOdds(sport, matchId)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache key for odds
    const cacheKey = `odds-${sport}-${matchId || 'all'}-${region}`;
    const cached = oddsCache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if fresh (30 seconds)
    if (cached && now - cached.timestamp < 30000) {
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'rapidapi',
          sport,
          data: cached.data,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from RapidAPI Odds
    const host = 'odds.p.rapidapi.com';
    const endpoint = sport === 'football' ? 'v4/sports/soccer/odds' : `v4/sports/${sport}/odds`;
    const url = `https://${host}/${endpoint}?regions=${region || 'us'}&markets=${markets?.join(',') || 'h2h'}`;
    
    console.log(`Fetching odds from RapidAPI: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': host
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const transformedData = transformOddsData(data, sport);
    
    // Cache the data
    oddsCache.set(cacheKey, { data: transformedData, timestamp: now });
    
    return new Response(
      JSON.stringify({
        success: true,
        provider: 'rapidapi',
        sport,
        data: transformedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sports-rapidapi-odds:', error);
    
    // Return mock data on error
    const body = await req.json().catch(() => ({}));
    const sport = body.sport || 'football';
    const matchId = body.matchId;
    
    return new Response(
      JSON.stringify({
        success: true,
        provider: 'mock',
        sport,
        data: generateMockOdds(sport, matchId),
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});