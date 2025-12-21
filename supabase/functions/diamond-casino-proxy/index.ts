import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Constants
const TIMEOUTS = {
  ODDS_FETCH: 8000,
  TABLE_FETCH: 8000,
  STREAM_FETCH: 10000,
  TABLE_ID_FETCH: 5000,
} as const;

const HOSTINGER_PROXY_BASE = 'http://72.61.169.60:8000/api/casino';
const CASINO_IMAGE_BASE = 'https://sitethemedata.com/casino-games';

// CORS headers - use environment variable for production
const getAllowedOrigin = () => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  return allowedOrigin || '*';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const CASINO_API_URL = Deno.env.get('DIAMOND_CASINO_API_URL')?.replace(/\/$/, '');
    const CASINO_API_KEY = Deno.env.get('DIAMOND_CASINO_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Whitelisted domain for stream server CORS
    const WHITELISTED_DOMAIN = Deno.env.get('WHITELISTED_STREAM_DOMAIN') || 'https://www.rrbexchange.com';

    // Note: CASINO_API_URL and CASINO_API_KEY are optional - bets can be recorded locally

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Handle GET requests (image proxy and HLS stream proxy)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const imagePath = url.searchParams.get('image');
      const streamUrl = url.searchParams.get('stream');
      
      // Handle HLS stream proxy
      if (streamUrl) {
        console.log(`🎬 HLS Stream Proxy Handler - Starting`);
        console.log(`📥 Received stream URL parameter: ${streamUrl}`);
        try {
          let decodedStreamUrl: string;
          try {
            decodedStreamUrl = decodeURIComponent(streamUrl);
            console.log(`📺 Proxying HLS stream: ${decodedStreamUrl}`);
          } catch (decodeError) {
            console.error(`❌ URL decode error:`, decodeError);
            return new Response(JSON.stringify({ 
              error: 'Invalid stream URL encoding',
              message: decodeError instanceof Error ? decodeError.message : 'Unknown decode error',
              originalUrl: streamUrl
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Validate URL format
          let streamUrlObj: URL;
          try {
            streamUrlObj = new URL(decodedStreamUrl);
          } catch (urlError) {
            console.error(`❌ Invalid URL format:`, urlError);
            return new Response(JSON.stringify({ 
              error: 'Invalid stream URL format',
              message: urlError instanceof Error ? urlError.message : 'Invalid URL',
              originalUrl: decodedStreamUrl
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Try to fetch the stream with whitelisted domain as Origin
          // Since domain is whitelisted, use the whitelisted domain as Origin header
          let streamResponse: Response;
          try {
            // Get whitelisted domain - priority: env variable > request origin > default
            let whitelistedOrigin: string | undefined;
            
            // First try environment variable (most reliable)
            if (WHITELISTED_DOMAIN) {
              try {
                const domainUrl = new URL(WHITELISTED_DOMAIN);
                whitelistedOrigin = domainUrl.origin;
                console.log(`✅ Using whitelisted domain from env: ${whitelistedOrigin}`);
              } catch (e) {
                console.warn(`⚠️ Invalid WHITELISTED_STREAM_DOMAIN: ${WHITELISTED_DOMAIN}`);
              }
            }
            
            // Fallback to request origin if env variable not set
            if (!whitelistedOrigin) {
              const requestOrigin = req.headers.get('origin') || req.headers.get('referer');
              if (requestOrigin) {
                try {
                  const originUrl = new URL(requestOrigin);
                  whitelistedOrigin = originUrl.origin;
                  console.log(`✅ Using whitelisted origin from request: ${whitelistedOrigin}`);
                } catch (e) {
                  console.warn(`⚠️ Could not parse origin: ${requestOrigin}`);
                }
              }
            }
            
            // Build headers - ALWAYS include Origin and Referer with whitelisted domain
            const fetchHeaders: HeadersInit = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
            };
            
            // CRITICAL: Always send Origin and Referer headers with whitelisted domain
            if (whitelistedOrigin) {
              fetchHeaders['Origin'] = whitelistedOrigin;
              fetchHeaders['Referer'] = whitelistedOrigin;
              console.log(`✅ Sending Origin header: ${whitelistedOrigin}`);
              console.log(`✅ Sending Referer header: ${whitelistedOrigin}`);
            } else {
              // If no whitelisted origin, still try with stream URL origin
              fetchHeaders['Referer'] = decodedStreamUrl;
              console.log(`⚠️ No whitelisted origin, using stream URL as Referer`);
            }
            
            // Log all headers being sent (for debugging)
            console.log(`📡 Fetching stream with headers:`, JSON.stringify(Object.fromEntries(Object.entries(fetchHeaders))));
            console.log(`🔄 Starting fetch to: ${decodedStreamUrl}`);
            
            
            
            streamResponse = await fetch(decodedStreamUrl, {
              headers: fetchHeaders,
              redirect: 'follow',
              // Don't include credentials to avoid CORS preflight issues
            });
            
            console.log(`📥 Fetch completed. Status: ${streamResponse.status} ${streamResponse.statusText}`);
            
            // Log response headers to see what server returned
            const responseHeadersObj = Object.fromEntries(streamResponse.headers.entries());
            console.log(`📥 Response headers:`, JSON.stringify(responseHeadersObj));
            
            // Log specific CORS headers if present
            if (streamResponse.headers.get('access-control-allow-origin')) {
              console.log(`✅ CORS header present: access-control-allow-origin = ${streamResponse.headers.get('access-control-allow-origin')}`);
            }
          } catch (fetchError) {
            console.error(`❌ Fetch error:`, fetchError);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
            const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
            console.error(`❌ Fetch error details:`, { message: errorMessage, stack: errorStack });
            
            return new Response(JSON.stringify({ 
              error: 'Failed to fetch stream',
              message: errorMessage,
              originalUrl: decodedStreamUrl
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          console.log(`📊 Response status check: ${streamResponse.status} (ok: ${streamResponse.ok})`);
          
          if (!streamResponse.ok) {
            console.error(`❌ Stream fetch failed: ${streamResponse.status} ${streamResponse.statusText}`);
            let errorText = 'Unknown error';
            try {
              errorText = await streamResponse.text();
              console.error(`❌ Error response body (first 500 chars): ${errorText.substring(0, 500)}`);
            } catch (e) {
              console.error(`❌ Could not read error response:`, e);
            }
            console.error(`❌ Full error response: ${errorText}`);
            
            // If it's a 403, return a helpful error message
            if (streamResponse.status === 403) {
              return new Response(JSON.stringify({ 
                error: 'Stream access forbidden (403)', 
                message: 'The stream server is blocking access. This may be due to CORS restrictions or authentication requirements.',
                originalUrl: decodedStreamUrl,
                status: 403
              }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            
            return new Response(JSON.stringify({ 
              error: `Stream not accessible: ${streamResponse.status}`,
              status: streamResponse.status,
              originalUrl: decodedStreamUrl
            }), {
              status: streamResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const contentType = streamResponse.headers.get('content-type') || 'application/vnd.apple.mpegurl';
          console.log(`📦 Response content-type: ${contentType}`);
          console.log(`📦 All response headers:`, Object.fromEntries(streamResponse.headers.entries()));
          
          let streamText: string;
          
          try {
            console.log(`📖 Reading response body...`);
            streamText = await streamResponse.text();
            console.log(`✅ Stream content fetched successfully!`);
            console.log(`✅ Content length: ${streamText.length} bytes`);
            console.log(`✅ Content preview (first 300 chars): ${streamText.substring(0, 300)}`);
          } catch (textError) {
            console.error(`❌ Error reading stream text:`, textError);
            return new Response(JSON.stringify({ 
              error: 'Failed to read stream content',
              message: textError instanceof Error ? textError.message : 'Unknown error',
              originalUrl: decodedStreamUrl
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Check if response is HTML (might be error page or redirect)
          if (contentType.includes('text/html')) {
            console.log(`⚠️ Server returned HTML instead of HLS manifest`);
            console.log(`📄 Full HTML response: ${streamText}`);
            
            // Try to extract stream URL from HTML (common patterns)
            let extractedUrl: string | null = null;
            try {
              const urlPatterns = [
                /https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi,
                /https?:\/\/[^\s"']+tvop[^\s"']*/gi,
                /"url":\s*"([^"]+)"/gi,
                /'url':\s*'([^']+)'/gi,
              ];
              
              for (const pattern of urlPatterns) {
                try {
                  const match = streamText.match(pattern);
                  if (match && match[0]) {
                    extractedUrl = match[0].replace(/["']/g, '').trim();
                    // Validate that it's a valid URL
                    try {
                      new URL(extractedUrl);
                      console.log(`✅ Extracted stream URL from HTML: ${extractedUrl}`);
                      break;
                    } catch (urlValidationError) {
                      console.warn(`⚠️ Extracted URL is invalid: ${extractedUrl}`);
                      extractedUrl = null;
                    }
                  }
                } catch (patternError) {
                  console.warn(`⚠️ Error matching pattern:`, patternError);
                  continue;
                }
              }
            } catch (extractionError) {
              console.error(`❌ Error during URL extraction:`, extractionError);
            }
            
            if (extractedUrl) {
              // Recursively fetch the extracted URL
              console.log(`🔄 Fetching extracted stream URL: ${extractedUrl}`);
              try {
                // Safely get whitelisted origin
                let whitelistedOriginForFetch = 'https://www.rrbexchange.com';
                if (WHITELISTED_DOMAIN) {
                  try {
                    whitelistedOriginForFetch = new URL(WHITELISTED_DOMAIN).origin;
                  } catch (urlParseError) {
                    console.warn(`⚠️ Could not parse WHITELISTED_DOMAIN, using default: ${WHITELISTED_DOMAIN}`);
                  }
                }
                
                const extractedResponse = await fetch(extractedUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'Origin': whitelistedOriginForFetch,
                    'Referer': whitelistedOriginForFetch,
                  },
                  redirect: 'follow',
                });
                
                if (extractedResponse.ok) {
                  const extractedContent = await extractedResponse.text();
                  const extractedContentType = extractedResponse.headers.get('content-type') || 'application/vnd.apple.mpegurl';
                  console.log(`✅ Extracted stream fetched successfully. Content-type: ${extractedContentType}`);
                  
                  // Use the extracted content
                  streamText = extractedContent;
                  // Update content type for processing
                  const reqUrlObj = new URL(req.url);
                  const proxyBase = `${reqUrlObj.origin}${reqUrlObj.pathname}?stream=`;
                  
                  // Rewrite URLs in the manifest
                  // Cache URL object to avoid multiple instantiations
                  const extractedUrlObj = new URL(extractedUrl!);
                  const extractedBasePath = extractedUrlObj.pathname.substring(0, extractedUrlObj.pathname.lastIndexOf('/') + 1);
                  const extractedOrigin = extractedUrlObj.origin;
                  
                  let processedContent = streamText.replace(
                    /(https?:\/\/[^\s]+|\.\/[^\s]+|\/[^\s]+\.(ts|m3u8))/g,
                    (match) => {
                      try {
                        if (match.startsWith('http://') || match.startsWith('https://')) {
                          return `${proxyBase}${encodeURIComponent(match)}`;
                        }
                        const absoluteUrl = new URL(match, extractedOrigin + extractedBasePath).href;
                        return `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
                      } catch (urlError) {
                        console.warn(`⚠️ Could not rewrite URL: ${match}`, urlError);
                        return match;
                      }
                    }
                  );
                  
                  return new Response(processedContent, {
                    headers: {
                      ...corsHeaders,
                      'Content-Type': extractedContentType,
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                    }
                  });
                }
              } catch (extractError) {
                console.error(`❌ Error fetching extracted URL:`, extractError);
              }
            }
            
            // Check if it's a token expiration error (case-insensitive, handle HTML encoding)
            const streamTextLower = streamText.toLowerCase();
            const isTokenExpired = streamTextLower.includes('invalid stream token') || 
                                   streamTextLower.includes('token is invalid') || 
                                   streamTextLower.includes('token has expired') ||
                                   (streamTextLower.includes('expired') && streamTextLower.includes('token'));
            
            if (isTokenExpired) {
              console.error(`❌ Stream token expired or invalid detected in HTML response`);
              console.log(`📄 HTML content preview: ${streamText.substring(0, 300)}`);
              return new Response(JSON.stringify({
                error: 'Stream token expired',
                message: 'The stream token has expired or is invalid. Please refresh the stream URL.',
                tokenExpired: true,
                htmlPreview: streamText.substring(0, 500),
                originalUrl: decodedStreamUrl
              }), {
                status: 401, // Use 401 to indicate authentication/token issue
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            
            // If we can't extract a URL, return error
            return new Response(JSON.stringify({
              error: 'Stream server returned HTML instead of HLS manifest',
              message: 'The stream URL may be incorrect or the server is returning an error page',
              htmlPreview: streamText.substring(0, 500),
              originalUrl: decodedStreamUrl
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // If it's a manifest (.m3u8), rewrite URLs to use proxy
          let processedContent = streamText;
          if (contentType.includes('mpegurl') || contentType.includes('x-mpegurl') || decodedStreamUrl.includes('.m3u8') || decodedStreamUrl.includes('tvop')) {
            try {
              const reqUrlObj = new URL(req.url);
              const proxyBase = `${reqUrlObj.origin}${reqUrlObj.pathname}?stream=`;
              
              console.log(`🔄 Rewriting manifest URLs with proxy base: ${proxyBase}`);
              
              // Rewrite relative URLs to use proxy
              processedContent = streamText.replace(
                /(https?:\/\/[^\s]+|\.\/[^\s]+|\/[^\s]+\.(ts|m3u8))/g,
                (match) => {
                  try {
                    // If it's already absolute, use it
                    if (match.startsWith('http://') || match.startsWith('https://')) {
                      return `${proxyBase}${encodeURIComponent(match)}`;
                    }
                    // If it's relative, make it absolute first
                    const basePath = streamUrlObj.pathname.substring(0, streamUrlObj.pathname.lastIndexOf('/') + 1);
                    const absoluteUrl = new URL(match, streamUrlObj.origin + basePath).href;
                    return `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
                  } catch (urlError) {
                    console.warn(`⚠️ Could not rewrite URL: ${match}`, urlError);
                    return match;
                  }
                }
              );
              console.log(`✅ Manifest URLs rewritten`);
            } catch (rewriteError) {
              console.error(`❌ Error rewriting manifest:`, rewriteError);
              const errorMessage = rewriteError instanceof Error ? rewriteError.message : String(rewriteError);
              console.error(`❌ Rewrite error details:`, { message: errorMessage, error: rewriteError });
              // Continue with original content if rewriting fails
            }
          }
          
          return new Response(processedContent, {
            headers: {
              ...corsHeaders,
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': '*',
            }
          });
        } catch (proxyError) {
          console.error('❌ HLS stream proxy error:', proxyError);
          const errorMessage = proxyError instanceof Error ? proxyError.message : String(proxyError);
          const errorStack = proxyError instanceof Error ? proxyError.stack : undefined;
          const errorName = proxyError instanceof Error ? proxyError.name : 'UnknownError';
          console.error('❌ Error details:', { 
            name: errorName,
            message: errorMessage, 
            stack: errorStack,
            error: proxyError
          });
          
          // Return detailed error for debugging
          return new Response(JSON.stringify({ 
            error: 'Failed to proxy stream', 
            message: errorMessage,
            name: errorName,
            details: errorStack,
            timestamp: new Date().toISOString()
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Handle image proxy
      if (imagePath) {
        console.log(`🖼️ Proxying image: ${imagePath}`);
        
        // Try multiple image source URLs
        const urlVariations = [
          `https://sitethemedata.com/casino-games/${imagePath}`,
          `https://dzm0kbaskt4pv.cloudfront.net/v11/images/games/${imagePath}`,
          `https://dzm0kbaskt4pv.cloudfront.net/images/games/${imagePath}`,
        ];

        for (const imageUrl of urlVariations) {
          try {
            console.log(`📡 Trying image URL: ${imageUrl}`);
            const imageResponse = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              }
            });

            if (imageResponse.ok) {
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const imageData = await imageResponse.arrayBuffer();
              
              return new Response(imageData, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400',
                }
              });
            }
          } catch (error) {
            console.error(`Fetch error for ${imageUrl}:`, error);
          }
        }

        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Missing stream or image parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle POST requests for API actions
    const { action, tableId, betData, date } = await req.json();
    console.log(`Casino API request: action=${action}, tableId=${tableId}`);

    let result;

    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = TIMEOUTS.ODDS_FETCH) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Fetch timeout error for ${url}:`, errorMessage);
        throw error;
      }
    };

    // Get live tables from Hostinger VPS proxy
    if (action === 'get-tables') {
      const HOSTINGER_PROXY_URL = `${HOSTINGER_PROXY_BASE}/tableid`;
      console.log(`📡 Fetching tables from: ${HOSTINGER_PROXY_URL}`);
      
      let tables: any[] = [];
      let fromCache = false;
      
      try {
        const response = await fetchWithTimeout(HOSTINGER_PROXY_URL, {
          headers: { 'Content-Type': 'application/json' }
        }, TIMEOUTS.TABLE_FETCH);

        if (!response.ok) {
          throw new Error(`Failed to fetch tables: ${response.status}`);
        }

        const apiData = await response.json();
        
        let rawTables: any[] = [];
        
        if (Array.isArray(apiData)) {
          rawTables = apiData;
        } else if (apiData?.data?.t1) {
          rawTables = apiData.data.t1;
        } else if (Array.isArray(apiData?.data)) {
          rawTables = apiData.data;
        }
        
        tables = rawTables.map((table: any) => {
          let imageUrl = '';
          if (table.imgpath) {
            imageUrl = `${CASINO_IMAGE_BASE}/${table.imgpath}`;
          } else if (table.imageUrl) {
            imageUrl = table.imageUrl;
          } else if (table.img) {
            imageUrl = table.img.startsWith('http') ? table.img : `${CASINO_IMAGE_BASE}/${table.img}`;
          }
          
          return {
            id: table.gmid || table.id || table.gtype || String(Math.random()),
            name: table.gname || table.name || table.gtype || 'Unknown Table',
            type: table.gmid || table.type || table.gtype,
            data: table,
            status: table.status || table.gstatus || 'active',
            players: table.players || 0,
            imageUrl
          };
        });

        // Update database cache
        for (const table of tables) {
          await supabase
            .from('diamond_casino_tables')
            .upsert({
              table_id: table.id,
              table_name: table.name,
              table_data: table.data,
              player_count: table.players,
              status: table.status,
              last_updated: new Date().toISOString()
            }, { onConflict: 'table_id' });
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.log(`⚠️ VPS unreachable, falling back to cached tables:`, errorMessage);
        fromCache = true;
        
        // Fallback to cached data from database
        const { data: cachedTables } = await supabase
          .from('diamond_casino_tables')
          .select('*')
          .order('table_name');
        
        if (cachedTables && cachedTables.length > 0) {
          tables = cachedTables.map((t: any) => ({
            id: t.table_id,
            name: t.table_name,
            type: t.table_id,
            data: t.table_data,
            status: t.status || 'active',
            players: t.player_count || 0,
            imageUrl: t.table_data?.imgpath 
              ? `https://sitethemedata.com/casino-games/${t.table_data.imgpath}` 
              : ''
          }));
        }
      }

      result = { success: true, data: { tables }, fromCache };
    }

    // Get specific table details
    else if (action === 'get-table' && tableId) {
      const { data: cachedTable } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .eq('table_id', tableId)
        .single();
      
      result = cachedTable 
        ? { success: true, data: cachedTable.table_data || { id: tableId, name: cachedTable.table_name } }
        : { success: true, data: { id: tableId } };
    }

    // Get live stream URL
    else if (action === 'get-stream-url' && tableId) {
      try {
        // Option 1: Use Hostinger proxy URL directly as stream URL
        const hostingerStreamUrl = `${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`;
        
        // Option 2: Fetch the actual stream URL from Hostinger proxy and proxy through edge function
        const response = await fetch(hostingerStreamUrl, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📺 Raw stream response from Hostinger:`, JSON.stringify(data, null, 2));
          
          // Extract the actual stream URL from response
          const actualStreamUrl = data.url || data.tv_url || data.stream_url || data.data?.url || data.data?.tv_url || data.data || (typeof data === 'string' ? data : null);
          
          if (actualStreamUrl) {
            // Try to create a proxied URL through our edge function
            // But if the stream server blocks proxy requests, use Hostinger proxy directly
            const reqUrl = new URL(req.url);
            const origin = reqUrl.origin.replace('http://', 'https://');
            const functionPath = reqUrl.pathname.includes('/functions/v1/') 
              ? reqUrl.pathname 
              : `/functions/v1${reqUrl.pathname}`;
            const edgeFunctionBase = `${origin}${functionPath}`;
            const proxiedUrl = `${edgeFunctionBase}?stream=${encodeURIComponent(actualStreamUrl)}`;
            
            console.log(`✅ Actual stream URL: ${actualStreamUrl}`);
            console.log(`✅ Hostinger proxy URL: ${hostingerStreamUrl}`);
            console.log(`✅ Edge function proxied URL: ${proxiedUrl}`);
            
            // Return both options - frontend can try proxied first, fallback to Hostinger proxy
            result = { 
              success: true, 
              data, 
              streamUrl: actualStreamUrl,
              proxiedUrl: proxiedUrl,
              hostingerProxyUrl: hostingerStreamUrl, // Alternative: use Hostinger proxy directly
            };
          } else {
            // If no stream URL found, try using Hostinger proxy directly
            console.log(`⚠️ No stream URL in response, using Hostinger proxy directly`);
            result = { 
              success: true, 
              data, 
              streamUrl: hostingerStreamUrl,
              proxiedUrl: hostingerStreamUrl,
              hostingerProxyUrl: hostingerStreamUrl,
            };
          }
        } else {
          console.error(`❌ Hostinger proxy returned ${response.status}`);
          // Fallback: use Hostinger proxy URL directly
          result = { 
            success: true, 
            data: null, 
            streamUrl: hostingerStreamUrl,
            proxiedUrl: hostingerStreamUrl,
            hostingerProxyUrl: hostingerStreamUrl,
          };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
        console.error('Stream URL fetch error:', {
          tableId,
          message: errorMessage,
          stack: errorStack
        });
        // Fallback: use Hostinger proxy URL directly
        const hostingerStreamUrl = `${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`;
        result = { 
          success: true, 
          data: null, 
          streamUrl: hostingerStreamUrl,
          proxiedUrl: hostingerStreamUrl,
          hostingerProxyUrl: hostingerStreamUrl,
        };
      }
    }

    // Get current result
    else if (action === 'get-result' && tableId) {
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          result = { success: true, data };
        } else {
          result = { success: true, data: null };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.error('Error fetching result:', {
          tableId,
          message: errorMessage
        });
        result = { success: true, data: null };
      }
    }

    // Get result history
    else if (action === 'get-result-history' && tableId) {
      const targetDate = date || new Date().toISOString().split('T')[0];
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/history?type=${tableId}&date=${targetDate}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          result = { success: true, data: Array.isArray(data) ? data : (data.data || data.history || []) };
        } else {
          result = { success: true, data: [] };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.error('Error fetching result history:', {
          tableId,
          date: targetDate,
          message: errorMessage
        });
        result = { success: true, data: [] };
      }
    }

    // Get table odds
    else if (action === 'get-odds' && tableId) {
      console.log(`📡 Fetching odds for: ${tableId}`);
      try {
        // Get gmid from tableid endpoint
        let gmid = tableId;
        
        try {
          const tableIdResponse = await fetchWithTimeout(`${HOSTINGER_PROXY_BASE}/tableid?id=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          }, TIMEOUTS.TABLE_ID_FETCH);
          
          if (tableIdResponse.ok) {
            const tableIdData = await tableIdResponse.json();
            const extractedGmid = tableIdData?.data?.gmid || tableIdData?.gmid || 
                                 tableIdData?.data?.mid || tableIdData?.mid;
            if (extractedGmid) {
              gmid = extractedGmid;
              console.log(`✅ Extracted gmid: ${gmid} for tableId: ${tableId}`);
            }
          }
        } catch (tableIdError) {
          const errorMessage = tableIdError instanceof Error ? tableIdError.message : String(tableIdError);
          console.log(`⚠️ Could not fetch gmid, using tableId as gmid:`, errorMessage);
        }
        
        // Try multiple endpoints for odds
        const oddsEndpoints = [
          `${HOSTINGER_PROXY_BASE}/data?type=${tableId}&id=${gmid}`,
          `${HOSTINGER_PROXY_BASE}/data?type=${tableId}`,
          `${HOSTINGER_PROXY_BASE}/odds?type=${tableId}&id=${gmid}`,
          `${HOSTINGER_PROXY_BASE}/odds?type=${tableId}`,
        ];

        let oddsData: any = null;

        for (const endpoint of oddsEndpoints) {
          try {
            console.log(`📡 Trying odds endpoint: ${endpoint}`);
            const response = await fetchWithTimeout(endpoint, {
              headers: { 'Content-Type': 'application/json' }
            }, TIMEOUTS.ODDS_FETCH);

            if (response && response.ok) {
              const data = await response.json();
              oddsData = data?.data || data;
              console.log(`✅ Odds fetched successfully from: ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            const errorMessage = endpointError instanceof Error ? endpointError.message : String(endpointError);
            console.log(`⚠️ Endpoint failed: ${endpoint}`, errorMessage);
            continue;
          }
        }

        if (oddsData) {
          const bettingOptions: any[] = [];
          
          // Parse sub, t1, t2, t3 arrays for betting options
          ['sub', 't1', 't2', 't3'].forEach((key) => {
            if (oddsData[key] && Array.isArray(oddsData[key])) {
              oddsData[key].forEach((item: any) => {
                if (item.nat || item.nation || item.name) {
                  const backVal = parseFloat(item.b1 || item.b || '0') || 0;
                  const layVal = parseFloat(item.l1 || item.l || '0') || 0;
                  
                  // Only add if there's a valid back or lay value
                  if (backVal > 0 || layVal > 0) {
                    bettingOptions.push({
                      type: item.nat || item.nation || item.name,
                      back: backVal,
                      lay: layVal,
                      status: item.gstatus === 'SUSPENDED' || item.gstatus === '0' ? 'suspended' : 'active',
                      min: item.min || 100,
                      max: item.max || 100000,
                      sid: item.sid,
                      mid: oddsData.mid || item.mid,
                      subtype: item.subtype,
                      etype: item.etype,
                    });
                  }
                }
              });
            }
          });
          
          // Also check if data is directly an array
          if (Array.isArray(oddsData) && oddsData.length > 0) {
            (oddsData as any[]).forEach((item: any) => {
              if (item.nat || item.nation || item.name) {
                const backVal = parseFloat(item.b1 || item.b || '0') || 0;
                const layVal = parseFloat(item.l1 || item.l || '0') || 0;
                
                if (backVal > 0 || layVal > 0) {
                  bettingOptions.push({
                    type: item.nat || item.nation || item.name,
                    back: backVal,
                    lay: layVal,
                    status: item.gstatus === 'SUSPENDED' || item.gstatus === '0' ? 'suspended' : 'active',
                    min: item.min || 100,
                    max: item.max || 100000,
                    sid: item.sid,
                    mid: item.mid,
                    subtype: item.subtype,
                    etype: item.etype,
                  });
                }
              }
            });
          }
          
          if (bettingOptions.length > 0) {
            console.log(`✅ Found ${bettingOptions.length} betting options`);
            result = { success: true, data: { bets: bettingOptions, raw: oddsData } };
          } else {
            console.log(`⚠️ No betting options found in odds data`);
            result = { success: true, data: { bets: [], raw: oddsData, noOdds: true } };
          }
        } else {
          console.log(`⚠️ No odds data received from any endpoint`);
          result = { success: true, data: { bets: [], raw: null, noOdds: true } };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
        console.error(`❌ Odds fetch error:`, {
          tableId,
          message: errorMessage,
          stack: errorStack
        });
        result = { success: true, data: { bets: [], raw: null, error: true } };
      }
    }

    // Get all casino table IDs
    else if (action === 'get-table-ids') {
      const response = await fetch('http://72.61.169.60:8000/api', {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table IDs: ${response.status}`);
      }

      const data = await response.json();
      result = { success: true, data };
    }

    // Place bet - Only database, no external API
    else if (action === 'place-bet' && betData) {
      try {
        console.log('📝 Place bet request:', { 
          tableId: betData.tableId, 
          amount: betData.amount, 
          betType: betData.betType,
          side: betData.side,
          odds: betData.odds 
        });
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        console.error('❌ No authorization header');
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ No user found');
        throw new Error('Unauthorized');
      }

      // Validate bet data
      if (!betData.amount || betData.amount <= 0) {
        throw new Error('Invalid bet amount');
      }
      if (!betData.betType) {
        throw new Error('Bet type is required');
      }
      if (!betData.tableId) {
        throw new Error('Table ID is required');
      }

      // Check wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (walletFetchError) {
        console.error('❌ Wallet fetch error:', walletFetchError);
        throw new Error(`Failed to fetch wallet: ${walletFetchError.message}`);
      }

      if (!wallet) {
        throw new Error('Wallet not found. Please contact support.');
      }

      if (wallet.current_balance < betData.amount) {
        throw new Error(`Insufficient balance. You have ₹${wallet.current_balance}, but need ₹${betData.amount}`);
      }

      // Deduct from wallet
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: betData.amount,
        p_type: 'debit',
        p_reason: `Diamond Casino bet on ${betData.tableName}`,
        p_game_type: 'casino'
      });

      if (walletError) throw new Error(`Wallet update failed: ${walletError.message}`);

      // Record bet in database
      // Build insert data - only include side if it's provided and valid
      let betInsertData: any = {
        user_id: user.id,
        table_id: betData.tableId,
        table_name: betData.tableName || null,
        bet_amount: betData.amount,
        bet_type: betData.betType,
        odds: betData.odds || null,
        round_id: betData.roundId || null,
        status: 'pending',
      };

      // Only add side if it's provided and is a valid value
      if (betData.side && (betData.side === 'back' || betData.side === 'lay')) {
        betInsertData.side = betData.side;
      }

      console.log('📝 Inserting bet with data:', { ...betInsertData, user_id: '[hidden]' });

      // Try to insert - if side column doesn't exist, it will fail and we'll retry without it
      let { data: bet, error: betError } = await supabase
        .from('diamond_casino_bets')
        .insert(betInsertData)
        .select()
        .single();

      // If error is about missing side column, retry without it
      if (betError && betError.message && (
        betError.message.toLowerCase().includes('column') && betError.message.toLowerCase().includes('side') ||
        betError.message.toLowerCase().includes('does not exist') ||
        betError.code === '42703' // PostgreSQL error code for undefined column
      )) {
        console.log('⚠️ Side column not found, retrying without it');
        delete betInsertData.side;
        const retryResult = await supabase
          .from('diamond_casino_bets')
          .insert(betInsertData)
          .select()
          .single();
        bet = retryResult.data;
        betError = retryResult.error;
      }

      if (betError) {
        console.error('❌ Bet insert error:', betError);
        console.error('❌ Bet insert data:', betInsertData);
        console.error('❌ Error code:', betError.code);
        console.error('❌ Error message:', betError.message);
        console.error('❌ Error details:', betError);
        
        // Refund if database insert fails
        try {
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: betData.amount,
            p_type: 'credit',
            p_reason: 'Bet refund - recording failed',
            p_game_type: 'casino'
          });
          console.log('✅ Refund processed');
        } catch (refundError) {
          console.error('❌ Refund failed:', refundError);
        }
        throw new Error(`Bet recording failed: ${betError.message || JSON.stringify(betError)}`);
      }

        console.log('✅ Bet inserted successfully:', bet?.id);

        result = { 
          success: true, 
          bet, 
          message: 'Bet placed successfully'
        };
      } catch (placeBetError: any) {
        console.error('❌ Place bet error in try block:', placeBetError);
        console.error('❌ Place bet error message:', placeBetError?.message);
        console.error('❌ Place bet error stack:', placeBetError?.stack);
        // Re-throw to be caught by outer catch block
        throw placeBetError;
      }
    }

    // Process/settle bets based on results
    else if (action === 'process-bets' && tableId) {
      // Get latest result for the table
      let resultData = null;
      try {
        const resultResponse = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (resultResponse.ok) {
          const resultJson = await resultResponse.json();
          const resData = resultJson?.data?.data?.res || resultJson?.data?.res || resultJson?.res || [];
          if (Array.isArray(resData) && resData.length > 0) {
            resultData = resData[0]; // Latest result
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching result for settlement:', {
          tableId,
          message: errorMessage
        });
      }

      if (!resultData || !(resultData as any).win) {
        result = { 
          success: false, 
          error: 'No result available for settlement' 
        };
      } else {
        // Get all pending bets for this table
        const { data: pendingBets, error: betsError } = await supabase
          .from('diamond_casino_bets')
          .select('*')
          .eq('table_id', tableId)
          .eq('status', 'pending');

        if (betsError) {
          throw new Error(`Failed to fetch pending bets: ${betsError.message}`);
        }

        if (!pendingBets || pendingBets.length === 0) {
          result = { 
            success: true, 
            message: 'No pending bets to process',
            processed: 0
          };
        } else {
          const winningValue = ((resultData as any).win || '').toString();
          let processed = 0;
          let won = 0;
          let lost = 0;
          let totalPayouts = 0;

          // Process each pending bet
          for (const bet of pendingBets) {
            try {
              // Determine if bet won based on bet_type and result
              // Result win can be "1", "2", "Player A", "Player B", or selection name
              const betSide = bet.side || 'back';
              const betTypeLower = bet.bet_type.toLowerCase().trim();
              const winLower = winningValue.toLowerCase().trim();
              
              // Try multiple matching strategies for flexible matching
              let betWon = false;
              
              if (betSide === 'back') {
                // Back bet wins if bet_type matches result
                // Direct match
                if (bet.bet_type === winningValue || betTypeLower === winLower) {
                  betWon = true;
                }
                // Substring match (e.g., "Player A" contains "1" or vice versa)
                else if (betTypeLower.includes(winLower) || winLower.includes(betTypeLower)) {
                  betWon = true;
                }
                // Numeric mapping: "1" -> "Player A", "Team 1", etc.
                else if (winningValue === '1' && (betTypeLower.includes('player a') || betTypeLower.includes('team 1') || betTypeLower.includes('1'))) {
                  betWon = true;
                }
                else if (winningValue === '2' && (betTypeLower.includes('player b') || betTypeLower.includes('team 2') || betTypeLower.includes('2'))) {
                  betWon = true;
                }
                // Check if bet_type matches common winner patterns
                else if ((winLower === '1' || winLower === 'player a' || winLower === 'team 1') && 
                         (betTypeLower.includes('1') || betTypeLower.includes('a') || betTypeLower.includes('first'))) {
                  betWon = true;
                }
                else if ((winLower === '2' || winLower === 'player b' || winLower === 'team 2') && 
                         (betTypeLower.includes('2') || betTypeLower.includes('b') || betTypeLower.includes('second'))) {
                  betWon = true;
                }
              } else {
                // Lay bet wins if bet_type doesn't match result (opposite of back)
                // Direct mismatch
                if (bet.bet_type !== winningValue && betTypeLower !== winLower) {
                  // Check if they're clearly different
                  const isDifferent = !betTypeLower.includes(winLower) && !winLower.includes(betTypeLower);
                  
                  // Also check numeric mappings
                  const isNumericMismatch = !(
                    (winningValue === '1' && (betTypeLower.includes('player a') || betTypeLower.includes('team 1') || betTypeLower.includes('1'))) ||
                    (winningValue === '2' && (betTypeLower.includes('player b') || betTypeLower.includes('team 2') || betTypeLower.includes('2')))
                  );
                  
                  betWon = isDifferent && isNumericMismatch;
                }
              }

              const newStatus = betWon ? 'won' : 'lost';
              const payoutAmount = betWon && bet.odds 
                ? parseFloat((bet.bet_amount * bet.odds).toFixed(2))
                : 0;

              // Update bet status
              const { error: updateError } = await supabase
                .from('diamond_casino_bets')
                .update({
                  status: newStatus,
                  payout_amount: payoutAmount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', bet.id);

              if (updateError) {
                console.error(`Error updating bet ${bet.id}:`, updateError);
                continue;
              }

              // Credit wallet if bet won
              if (betWon && payoutAmount > 0) {
                const { error: walletError } = await supabase.rpc('update_wallet_balance', {
                  p_user_id: bet.user_id,
                  p_amount: payoutAmount,
                  p_type: 'credit',
                  p_reason: `Diamond Casino win - ${bet.table_name || bet.table_id} (${bet.bet_type})`,
                  p_game_type: 'casino'
                });

                if (walletError) {
                  console.error(`Error crediting wallet for bet ${bet.id}:`, walletError);
                } else {
                  totalPayouts += payoutAmount;
                  won++;
                }
              } else {
                lost++;
              }

              processed++;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const errorStack = error instanceof Error ? error.stack : undefined;
              console.error(`Error processing bet ${bet.id}:`, {
                betId: bet.id,
                tableId: bet.table_id,
                message: errorMessage,
                stack: errorStack
              });
            }
          }

          result = {
            success: true,
            message: `Processed ${processed} bets`,
            processed,
            won,
            lost,
            totalPayouts
          };
        }
      }
    }

    else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diamond Casino API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
