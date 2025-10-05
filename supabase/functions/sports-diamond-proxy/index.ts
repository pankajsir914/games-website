import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get API key from environment variable (secure)
const RAPIDAPI_KEY = Deno.env.get('DIAMOND_SPORTS_RAPIDAPI_KEY') || Deno.env.get('RAPIDAPI_KEY');
const DIAMOND_HOST = 'diamond-sports-api-d247-sky-exchange-betfair.p.rapidapi.com';

// Check if API key is available
if (!RAPIDAPI_KEY) {
  console.error('DIAMOND_SPORTS_RAPIDAPI_KEY is not configured in environment variables');
}

// Simple in-memory cache with longer TTL
const cache = new Map<string, { data: any; ts: number; retryAfter?: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes for general data
const LIVE_TTL_MS = 60 * 1000; // 1 minute for live matches

// Rate limiting with exponential backoff
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests
let rateLimitBackoff = 0;
let consecutiveRateLimits = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if API key is configured
  if (!RAPIDAPI_KEY) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'API key not configured. Please contact administrator.' 
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse inputs from JSON body or query string
    let path = 'sports/esid';
    let sid: string | null = null;
    let gmid: string | null = null;
    let qs: Record<string, string> = {};
    let method = 'GET';
    let payload: any = null;

    const url = new URL(req.url);
    if (req.method === 'GET') {
      method = 'GET';
      path = url.searchParams.get('path') || path;
      sid = url.searchParams.get('sid');
      gmid = url.searchParams.get('gmid');
      // collect any extra query params
      url.searchParams.forEach((v, k) => {
        if (!['path', 'sid', 'gmid'].includes(k)) qs[k] = v;
      });
    } else {
      const text = await req.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          path = body.path || path;
          sid = body.sid ?? null;
          gmid = body.gmid ?? null;
          qs = typeof body.params === 'object' && body.params ? body.params : {};
          method = (body.method || 'GET').toString().toUpperCase();
          payload = body.payload ?? null;
        } catch (_) {
          // ignore
        }
      }
    }

    // Fix path formatting - remove leading slash if present
    if (path.startsWith('/')) path = path.substring(1);
    
    // Require sid for the esid endpoint
    if (path === 'sports/esid' && (!sid || sid.length === 0)) {
      console.log('Missing SID for sports/esid endpoint');
      return new Response(JSON.stringify({ success: false, error: 'sid is required for sports/esid', data: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Require sid and gmid for getPriveteData endpoint
    if (path === 'sports/getPriveteData' && (!sid || !gmid)) {
      console.log('Missing SID or GMID for sports/getPriveteData endpoint');
      return new Response(JSON.stringify({ success: false, error: 'sid and gmid are required for sports/getPriveteData', data: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams(qs);
    if (sid) params.set('sid', String(sid));
    if (gmid) params.set('gmid', String(gmid));
    const targetUrl = `https://${DIAMOND_HOST}/${path}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('Request details:', {
      path,
      sid,
      gmid,
      params: Object.fromEntries(params),
      targetUrl,
      method
    });

    const cacheKey = targetUrl;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    
    // Use shorter TTL for live endpoints
    const isLiveEndpoint = targetUrl.includes('live') || params.get('kind') === 'live';
    const effectiveTTL = isLiveEndpoint ? LIVE_TTL_MS : TTL_MS;
    
    if (method === 'GET' && hit && now - hit.ts < effectiveTTL) {
      return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: true, data: hit.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced rate limiting with exponential backoff
    const timeSinceLastRequest = now - lastRequestTime;
    const currentInterval = MIN_REQUEST_INTERVAL + rateLimitBackoff;
    
    if (timeSinceLastRequest < currentInterval) {
      const waitTime = currentInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const headers: Record<string, string> = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': DIAMOND_HOST,
    };
    if (method !== 'GET') headers['Content-Type'] = 'application/json';

    console.log('Making request to Diamond API:', targetUrl);
    const res = await fetch(targetUrl, {
      method,
      headers,
      body: method === 'POST' && payload ? JSON.stringify(payload) : undefined,
    });

    console.log('Diamond API response status:', res.status, res.statusText);
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = { raw: text };
    }

    if (!res.ok) {
      // Handle rate limiting
      if (res.status === 429) {
        consecutiveRateLimits++;
        rateLimitBackoff = Math.min(30000, MIN_REQUEST_INTERVAL * Math.pow(2, consecutiveRateLimits)); // Max 30s backoff
        console.log(`Rate limited (429). Increasing backoff to ${rateLimitBackoff}ms`);
        
        // Cache the error to prevent immediate retries
        cache.set(cacheKey, { 
          data: { error: 'Rate limited. Please try again later.', status: 429 }, 
          ts: now,
          retryAfter: rateLimitBackoff 
        });
      }
      throw new Error(`Diamond API error ${res.status}: ${res.statusText}`);
    }
    
    // Reset rate limit counters on successful request
    consecutiveRateLimits = 0;
    rateLimitBackoff = 0;

    // Normalize the response structure for consistency
    let normalizedData = json;
    
    // If the response has the nested Diamond API structure, extract the matches
    if (json?.data?.t1) {
      console.log('Normalizing Diamond API response: found data.t1 structure');
      normalizedData = json;  // Keep full structure for detailed parsing in frontend
    }
    
    if (method === 'GET') cache.set(cacheKey, { data: normalizedData, ts: now });

    return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: false, data: normalizedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('sports-diamond-proxy error:', e);
    return new Response(JSON.stringify({ success: false, provider: 'diamond', error: e.message || String(e), data: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});