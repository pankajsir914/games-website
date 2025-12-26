import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HOSTINGER_BASE = "http://72.61.169.60:8001/api";
const FETCH_TIMEOUT = 10_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/* ------------------ utils ------------------ */

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/* ------------------ handler ------------------ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Try to get params from body first (for POST requests), then fallback to URL params
    let bodyParams: any = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        bodyParams = JSON.parse(bodyText);
      }
    } catch {
      // Body parsing failed, will use URL params
    }

    /**
     * Frontend will call like:
     * /functions/v1/sports-proxy?action=esid&sid=4
     * OR with body: { action: "esid", sid: "4" }
     */
    const action = bodyParams.action || url.searchParams.get("action");

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUrl = "";

    /* ------------------ ROUTE MAP ------------------ */

    switch (action) {
      case "esid": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        if (!sid) throw new Error("sid required");
        targetUrl = `${HOSTINGER_BASE}/sports/esid?sid=${sid}`;
        break;
      }

      case "tree":
        targetUrl = `${HOSTINGER_BASE}/sports/tree`;
        break;

      case "details": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!sid || !gmid) throw new Error("sid & gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/getDetailsData?sid=${sid}&gmid=${gmid}`;
        break;
      }

      case "private": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!sid || !gmid) throw new Error("sid & gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/getPriveteData?sid=${sid}&gmid=${gmid}`;
        break;
      }

      case "score-tv": {
        const eventId = bodyParams.gmid || url.searchParams.get("gmid");
        const sid = bodyParams.sid || url.searchParams.get("sid");
        if (!eventId || !sid) throw new Error("gmid & sid required");
        targetUrl =
          `${HOSTINGER_BASE}/sports/betfairscorecardandtv?` +
          `diamondeventid=${eventId}&diamondsportsid=${sid}`;
        break;
      }

      case "virtual-tv": {
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!gmid) throw new Error("gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/virtual/tvurl?gmid=${gmid}`;
        break;
      }

      case "banner":
        targetUrl = `${HOSTINGER_BASE}/sports/welcomebanner`;
        break;

      case "top-events":
        targetUrl = `${HOSTINGER_BASE}/sports/topevents`;
        break;

      case "market-result": {
        const eventId = bodyParams.eventid || url.searchParams.get("eventid");
        if (!eventId) throw new Error("eventid required");
        targetUrl = `${HOSTINGER_BASE}/sports/posted-market-result?eventid=${eventId}`;
        break;
      }

      case "diamond-original-tv": {
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        const sid = bodyParams.sid || url.searchParams.get("sid");
        if (!gmid || !sid) throw new Error("gmid & sid required");
        
        try {
          // Fetch betfair endpoint to get TV URL with token
          const betfairEndpoint = `${HOSTINGER_BASE}/sports/betfairscorecardandtv?diamondeventid=${gmid}&diamondsportsid=${sid}`;
          console.log(`[Diamond Original TV] Fetching betfair endpoint: ${betfairEndpoint}`);
          const betfairResponse = await fetchWithTimeout(betfairEndpoint);
          
          console.log(`[Diamond Original TV] Betfair response status: ${betfairResponse.status}`);
          
          if (betfairResponse.ok) {
            const betfairData = await betfairResponse.json();
            
            // TEMPORARY: Log full response to debug token extraction
            console.log(`[Diamond Original TV] Full betfair response:`, JSON.stringify(betfairData, null, 2));
            console.log(`[Diamond Original TV] Response keys:`, Object.keys(betfairData || {}));
            if (betfairData.data) {
              console.log(`[Diamond Original TV] Data keys:`, Object.keys(betfairData.data || {}));
            }
            
            // Helper function to recursively search for token in any string value
            const findTokenInResponse = (obj: any, depth = 0): string => {
              if (depth > 10) return '';
              if (!obj || typeof obj === 'function') return '';
              
              if (typeof obj === 'string') {
                if (obj.includes('token=')) {
                  const tokenMatch = obj.match(/token=([^&]+)/);
                  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 5) {
                    return tokenMatch[1];
                  }
                }
                return '';
              }
              
              if (typeof obj === 'object') {
                for (const key in obj) {
                  if (obj.hasOwnProperty(key)) {
                    const found = findTokenInResponse(obj[key], depth + 1);
                    if (found) return found;
                  }
                }
              }
              
              return '';
            };
            
            // Extract TV URL from betfair response - check multiple possible locations
            let tvUrl = '';
            const possibleTvFields = [
              betfairData?.tv,
              betfairData?.tv_url,
              betfairData?.tvUrl,
              betfairData?.diamondoriginaltv,
              betfairData?.diamond_original_tv,
              betfairData?.data?.tv,
              betfairData?.data?.tv_url,
              betfairData?.data?.tvUrl,
              betfairData?.data?.diamondoriginaltv,
              betfairData?.data?.diamond_original_tv,
              betfairData?.data?.data?.tv,
              betfairData?.data?.data?.tv_url,
              betfairData?.result?.tv,
              betfairData?.result?.tv_url,
              betfairData?.result?.diamondoriginaltv,
            ];
            
            // Also search for any URL containing diamondoriginaltv
            const findDiamondOriginalTvUrl = (obj: any, depth = 0): string => {
              if (depth > 10) return '';
              if (!obj || typeof obj === 'function') return '';
              
              if (typeof obj === 'string') {
                if (obj.includes('diamondoriginaltv')) {
                  return obj;
                }
                return '';
              }
              
              if (typeof obj === 'object') {
                for (const key in obj) {
                  if (obj.hasOwnProperty(key)) {
                    const found = findDiamondOriginalTvUrl(obj[key], depth + 1);
                    if (found) return found;
                  }
                }
              }
              
              return '';
            };
            
            // First check direct fields
            for (const field of possibleTvFields) {
              if (field && typeof field === 'string' && field.length > 0) {
                tvUrl = field;
                break;
              }
            }
            
            // If not found, recursively search for diamondoriginaltv URL
            if (!tvUrl) {
              tvUrl = findDiamondOriginalTvUrl(betfairData);
            }
            
            // If TV URL contains diamondoriginaltv with token, use it directly
            if (tvUrl && tvUrl.includes('diamondoriginaltv')) {
              const tokenMatch = tvUrl.match(/token=([^&]+)/);
              const token = tokenMatch && tokenMatch[1] ? tokenMatch[1] : '';
              
              // If URL already has token, use it directly
              if (token && token.length > 5) {
                console.log(`[Diamond Original TV] ✅ Found complete URL with token from betfair response`);
                return new Response(
                  JSON.stringify({
                    success: true,
                    source: "betfair-direct",
                    action,
                    data: {
                      streamUrl: tvUrl,
                      token: token,
                      gmid: gmid,
                      sid: sid
                    },
                  }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              
              // If URL exists but no token, we'll try to extract token separately below
              console.log(`[Diamond Original TV] Found diamondoriginaltv URL but no token in URL: ${tvUrl.substring(0, 100)}...`);
            }
            
            // Extract token - try multiple methods
            let token = '';
            
            // Method 1: Extract from TV URL if it has token
            if (tvUrl && typeof tvUrl === 'string' && tvUrl.includes('token=')) {
              const tokenMatch = tvUrl.match(/token=([^&]+)/);
              if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 5) {
                token = tokenMatch[1];
                console.log(`[Diamond Original TV] ✅ Found token from TV URL (Method 1)`);
              }
            }
            
            // Method 2: Check direct token fields - expanded search
            if (!token) {
              token = betfairData?.token || 
                     betfairData?.data?.token || 
                     betfairData?.data?.data?.token ||
                     betfairData?.result?.token ||
                     betfairData?.access_token ||
                     betfairData?.data?.access_token ||
                     betfairData?.auth_token ||
                     betfairData?.data?.auth_token ||
                     betfairData?.tv_token ||
                     betfairData?.data?.tv_token ||
                     betfairData?.stream_token ||
                     betfairData?.data?.stream_token ||
                     betfairData?.diamond_token ||
                     betfairData?.data?.diamond_token ||
                     '';
              if (token) {
                console.log(`[Diamond Original TV] ✅ Found token in direct fields (Method 2)`);
              }
            }
            
            // Method 3: Recursively search entire response for token= pattern
            if (!token) {
              token = findTokenInResponse(betfairData);
              if (token) {
                console.log(`[Diamond Original TV] ✅ Found token via recursive search (Method 3)`);
              } else {
                console.log(`[Diamond Original TV] ⚠️ Recursive search found no token`);
              }
            }
            
            // Method 4: Check if any URL in response contains token
            if (!token) {
              const allUrls: string[] = [];
              const extractUrls = (obj: any, depth = 0) => {
                if (depth > 5) return;
                if (typeof obj === 'string' && obj.startsWith('http')) {
                  allUrls.push(obj);
                } else if (typeof obj === 'object' && obj !== null) {
                  for (const key in obj) {
                    extractUrls(obj[key], depth + 1);
                  }
                }
              };
              extractUrls(betfairData);
              
              console.log(`[Diamond Original TV] Found ${allUrls.length} URLs in response`);
              if (allUrls.length > 0) {
                console.log(`[Diamond Original TV] Sample URLs:`, allUrls.slice(0, 3).map((u: string) => u.substring(0, 150)));
              }
              
              for (const url of allUrls) {
                if (url.includes('token=')) {
                  const tokenMatch = url.match(/token=([^&]+)/);
                  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 5) {
                    token = tokenMatch[1];
                    console.log(`[Diamond Original TV] ✅ Found token in URL (Method 4): ${url.substring(0, 100)}...`);
                    break;
                  }
                }
              }
            }
            
            // Method 5: Check for token in query parameters of any URL
            if (!token && tvUrl) {
              // If we have a TV URL but no token, try to extract from query params
              const urlObj = new URL(tvUrl);
              const tokenParam = urlObj.searchParams.get('token');
              if (tokenParam && tokenParam.length > 5) {
                token = tokenParam;
                console.log(`[Diamond Original TV] ✅ Found token from URL query params (Method 5)`);
              }
            }
            
            // Method 6: Check all string values for token-like patterns
            if (!token) {
              const findAllStrings = (obj: any, depth = 0): string[] => {
                if (depth > 10) return [];
                if (!obj || typeof obj === 'function') return [];
                
                if (typeof obj === 'string') {
                  return [obj];
                }
                
                if (typeof obj === 'object') {
                  const strings: string[] = [];
                  for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                      strings.push(...findAllStrings(obj[key], depth + 1));
                    }
                  }
                  return strings;
                }
                
                return [];
              };
              
              const allStrings = findAllStrings(betfairData);
              for (const str of allStrings) {
                // Look for token= pattern
                if (str.includes('token=')) {
                  const tokenMatch = str.match(/token=([^&\s"']+)/);
                  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 5) {
                    token = tokenMatch[1];
                    console.log(`[Diamond Original TV] ✅ Found token in string value (Method 6)`);
                    break;
                  }
                }
                // Look for standalone token values (alphanumeric, 20+ chars)
                if (str.length > 20 && /^[a-zA-Z0-9]+$/.test(str) && !str.includes('http')) {
                  // Might be a token, but we need more context
                  console.log(`[Diamond Original TV] Found potential token string: ${str.substring(0, 30)}...`);
                }
              }
            }
            
            if (!token) {
              console.warn(`[Diamond Original TV] ⚠️ Token not found after all methods. TV URL: ${tvUrl?.substring(0, 100) || 'null'}`);
            } else {
              console.log(`[Diamond Original TV] ✅ Token extracted: ${token.substring(0, 20)}...`);
            }
            
            // Construct diamondoriginaltv URL
            const streamUrl = `https://cloud.turnkeyxgaming.com:9086/sports/diamondoriginaltv?gmid=${gmid}&sid=${sid}&token=${token || ''}`;
            
            return new Response(
              JSON.stringify({
                success: true,
                source: token ? "betfair-constructed" : "betfair-no-token",
                action,
                data: {
                  streamUrl: streamUrl,
                  token: token || '',
                  gmid: gmid,
                  sid: sid
                },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            console.warn(`[Diamond Original TV] Betfair endpoint returned ${betfairResponse.status}`);
            try {
              const errorText = await betfairResponse.text();
              console.warn(`[Diamond Original TV] Betfair error response: ${errorText.substring(0, 200)}`);
            } catch (e) {
              console.warn(`[Diamond Original TV] Could not read error response`);
            }
          }
        } catch (error: any) {
          console.error(`[Diamond Original TV] Error fetching betfair:`, error.message);
        }
        
        // Fallback: construct URL without token
        // Note: Even without token, some streams might work
        const fallbackUrl = `https://cloud.turnkeyxgaming.com:9086/sports/diamondoriginaltv?gmid=${gmid}&sid=${sid}&token=`;
        console.warn(`[Diamond Original TV] Using fallback URL without token`);
        
        return new Response(
          JSON.stringify({
            success: true,
            source: "fallback",
            action,
            data: {
              streamUrl: fallbackUrl,
              token: '',
              gmid: gmid,
              sid: sid,
              warning: 'Token not found in betfair response, using URL without token'
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    /* ------------------ FETCH ------------------ */

    const response = await fetchWithTimeout(targetUrl);

    const contentType = response.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${text.substring(0, 100)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "hostinger",
        action,
        data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
