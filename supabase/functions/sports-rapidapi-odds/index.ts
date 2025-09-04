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


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport, matchId, region, markets } = await req.json();
    
    // Check if RapidAPI key is configured
    if (!RAPIDAPI_KEY) {
      console.log('RapidAPI key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          provider: 'rapidapi',
          sport,
          data: [],
          error: 'RapidAPI key not configured'
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
    
    // Return error on failure
    const body = await req.json().catch(() => ({}));
    const sport = body.sport || 'football';
    const matchId = body.matchId;
    
    return new Response(
      JSON.stringify({
        success: false,
        provider: 'rapidapi',
        sport,
        data: [],
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});