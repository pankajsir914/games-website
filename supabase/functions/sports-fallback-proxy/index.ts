import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback mock data for when APIs are down
const MOCK_MATCHES = {
  cricket: [
    {
      id: '515110061',  // Using realistic match IDs like Diamond API
      eventId: '515110061',
      gmid: '515110061',
      name: 'India vs Australia',
      team1: 'India',
      team2: 'Australia',
      score: 'IND: 285/7 (50 ov) | AUS: 180/4 (32 ov)',
      status: 'live',
      date: new Date().toISOString(),
      isLive: true,
    },
    {
      id: '569905578',  // Using realistic match IDs
      eventId: '569905578',
      gmid: '569905578',
      name: 'England vs New Zealand',
      team1: 'England',
      team2: 'New Zealand',
      score: '',
      status: 'upcoming',
      date: new Date(Date.now() + 3600000).toISOString(),
      time: '14:00',
      isLive: false,
    }
  ],
  football: [
    {
      id: '602454856',  // Using realistic match IDs
      eventId: '602454856',
      gmid: '602454856',
      name: 'Real Madrid vs Barcelona',
      team1: 'Real Madrid',
      team2: 'Barcelona',
      score: '2 - 1',
      status: 'live',
      date: new Date().toISOString(),
      isLive: true,
    },
    {
      id: '683236118',  // Using realistic match IDs
      eventId: '683236118',
      gmid: '683236118',
      name: 'Manchester United vs Liverpool',
      team1: 'Manchester United',
      team2: 'Liverpool',
      score: '',
      status: 'upcoming',
      date: new Date(Date.now() + 7200000).toISOString(),
      time: '20:00',
      isLive: false,
    }
  ],
  tennis: [
    {
      id: 'mock5',
      eventId: 'mock5',
      name: 'Djokovic vs Nadal',
      team1: 'Novak Djokovic',
      team2: 'Rafael Nadal',
      score: '6-4, 4-6, 2-1',
      status: 'live',
      date: new Date().toISOString(),
      isLive: true,
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let sport = 'cricket';
    let sid = '4';
    
    // Parse request
    const url = new URL(req.url);
    if (req.method === 'GET') {
      sport = url.searchParams.get('sport') || 'cricket';
      sid = url.searchParams.get('sid') || '4';
    } else {
      const text = await req.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          sport = body.sport || 'cricket';
          sid = body.sid || '4';
        } catch (_) {
          // ignore
        }
      }
    }

    // Map SID to sport type
    const sidToSport: Record<string, string> = {
      '1': 'football',
      '2': 'tennis',
      '4': 'cricket',
      '7': 'basketball',
      '8': 'hockey',
    };
    
    const sportType = sidToSport[sid] || sport || 'cricket';
    
    // Return mock data for the requested sport
    const matches = MOCK_MATCHES[sportType as keyof typeof MOCK_MATCHES] || MOCK_MATCHES.cricket;
    
    console.log(`Sports fallback proxy returning mock data for ${sportType} (SID: ${sid})`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      provider: 'fallback',
      message: 'Using fallback data due to API limitations',
      data: matches 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('sports-fallback-proxy error:', e);
    return new Response(JSON.stringify({ 
      success: false, 
      provider: 'fallback',
      error: e.message || String(e), 
      data: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});