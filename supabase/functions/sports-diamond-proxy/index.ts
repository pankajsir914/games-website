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
const cache = new Map<string, { data: any; ts: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes for general data
const LIVE_TTL_MS = 60 * 1000; // 1 minute for live matches

// Mutex-based rate limiter with queue
class RequestMutex {
  private locked = false;
  private queue: Array<() => void> = [];
  private lastRequestTime = 0;
  private minInterval = 5000; // 5 seconds between requests (very conservative)
  private backoffMultiplier = 1;
  
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = async () => {
        if (!this.locked) {
          // Check if enough time has passed since last request
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          const requiredInterval = this.minInterval * this.backoffMultiplier;
          
          if (timeSinceLastRequest < requiredInterval) {
            const waitTime = requiredInterval - timeSinceLastRequest;
            console.log(`Rate limiter: waiting ${waitTime}ms before next request`);
            await new Promise(r => setTimeout(r, waitTime));
          }
          
          this.locked = true;
          this.lastRequestTime = Date.now();
          resolve();
        } else {
          this.queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }
  
  release(): void {
    this.locked = false;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
  
  increaseBackoff(): void {
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8); // Max 40 seconds
    console.log(`Rate limit backoff increased to ${this.minInterval * this.backoffMultiplier}ms`);
  }
  
  resetBackoff(): void {
    this.backoffMultiplier = 1;
  }
}

const requestMutex = new RequestMutex();

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
          // Extract params from body but don't override sid/gmid
          const bodyParams = typeof body.params === 'object' && body.params ? body.params : {};
          // Remove sid and gmid from params if they exist there
          const { sid: _, gmid: __, ...cleanParams } = bodyParams;
          qs = cleanParams;
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
      console.log('Serving from cache:', cacheKey);
      return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: true, data: hit.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Acquire mutex lock before making request
    await requestMutex.acquire();
    
    try {
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
        // Handle different error types with specific messages
        if (res.status === 429) {
          requestMutex.increaseBackoff();
          
          return new Response(JSON.stringify({ 
            success: false, 
            provider: 'diamond', 
            error: 'Rate limited. Please wait a moment and try again.',
            errorCode: 429,
            data: [] 
          }), {
            status: 200, // Return 200 so frontend can show friendly message
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else if (res.status === 404) {
          console.log(`Resource not found (404) for: ${targetUrl}`);
          return new Response(JSON.stringify({ 
            success: false, 
            provider: 'diamond', 
            error: 'Data not available for this match.',
            errorCode: 404,
            data: [] 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.error(`Diamond API error ${res.status}: ${res.statusText}`);
        
        return new Response(JSON.stringify({ 
          success: false, 
          provider: 'diamond', 
          error: `API error: ${res.statusText}`,
          errorCode: res.status,
          data: [] 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Reset backoff on successful request
      requestMutex.resetBackoff();

      // Normalize the response structure for consistency
      let normalizedData = json;
      
      // Transform getPriveteData response to t1/t2/t3 format
      if (path === 'sports/getPriveteData' && json?.data) {
        const markets = Array.isArray(json.data) ? json.data : [];
        const transformed: any = { t1: [], t2: [], t3: [] };
        
        markets.forEach((market: any) => {
          const mname = market.mname?.toUpperCase() || '';
          
          // Transform section array: convert odds[] to b1/l1 format
          const transformedSection = (market.section || []).map((team: any) => {
            const backOdds = (team.odds || []).filter((o: any) => o.otype === 'back');
            const layOdds = (team.odds || []).filter((o: any) => o.otype === 'lay');
            
            return {
              sid: team.sid,
              nat: team.nat,
              gstatus: team.gstatus || 'ACTIVE',
              b1: backOdds[0]?.odds || null,
              bs1: backOdds[0]?.size || null,
              b2: backOdds[1]?.odds || null,
              bs2: backOdds[1]?.size || null,
              b3: backOdds[2]?.odds || null,
              bs3: backOdds[2]?.size || null,
              l1: layOdds[0]?.odds || null,
              ls1: layOdds[0]?.size || null,
              l2: layOdds[1]?.odds || null,
              ls2: layOdds[1]?.size || null,
              l3: layOdds[2]?.odds || null,
              ls3: layOdds[2]?.size || null,
            };
          });
          
          const transformedMarket = {
            ...market,
            section: transformedSection
          };
          
          // Categorize by market type
          if (mname.includes('MATCH') || mname === 'ODDS') {
            transformed.t1.push(transformedMarket);
          } else if (mname.includes('BOOKMAKER')) {
            transformed.t3.push(transformedMarket);
          } else {
            transformed.t2.push(transformedMarket); // Fancy markets
          }
        });
        
        normalizedData = transformed;
      }
      
      if (method === 'GET') cache.set(cacheKey, { data: normalizedData, ts: now });

      return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: false, data: normalizedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      // Always release the mutex
      requestMutex.release();
    }
  } catch (e: any) {
    console.error('sports-diamond-proxy error:', e);
    return new Response(JSON.stringify({ success: false, provider: 'diamond', error: e.message || String(e), data: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
