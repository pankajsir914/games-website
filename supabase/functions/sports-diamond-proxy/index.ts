import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';
const DIAMOND_HOST = 'diamond-sports-api-d247-sky-exchange-betfair.p.rapidapi.com';

// Simple in-memory cache
const cache = new Map<string, { data: any; ts: number }>();
const TTL_MS = 30_000; // 30s

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse inputs from JSON body or query string
    let path = 'sports/esid';
    let sid: string | null = null;
    let qs: Record<string, string> = {};

    const url = new URL(req.url);
    if (req.method === 'GET') {
      path = url.searchParams.get('path') || path;
      sid = url.searchParams.get('sid');
      // collect any extra query params
      url.searchParams.forEach((v, k) => {
        if (!['path', 'sid'].includes(k)) qs[k] = v;
      });
    } else {
      const text = await req.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          path = body.path || path;
          sid = body.sid ?? null;
          qs = typeof body.params === 'object' && body.params ? body.params : {};
        } catch (_) {
          // ignore
        }
      }
    }

    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'RAPIDAPI_KEY missing', data: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Require sid for the esid endpoint
    if (path.endsWith('/esid') && (!sid || sid.length === 0)) {
      return new Response(JSON.stringify({ success: false, error: 'sid is required for /sports/esid', data: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams(qs);
    if (sid) params.set('sid', String(sid));
    const targetUrl = `https://${DIAMOND_HOST}/${path}${params.toString() ? `?${params.toString()}` : ''}`;

    const cacheKey = targetUrl;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    if (hit && now - hit.ts < TTL_MS) {
      return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: true, data: hit.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': DIAMOND_HOST,
      },
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = { raw: text };
    }

    if (!res.ok) {
      throw new Error(`Diamond API error ${res.status}: ${res.statusText}`);
    }

    cache.set(cacheKey, { data: json, ts: now });

    return new Response(JSON.stringify({ success: true, provider: 'diamond', cached: false, data: json }), {
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