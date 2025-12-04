import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { connect } from "https://deno.land/x/redis@v0.31.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Redis connection singleton
let redisClient: any = null;

async function getRedisClient() {
  if (!redisClient) {
    const REDIS_HOST = Deno.env.get('REDIS_HOST');
    const REDIS_PORT = Deno.env.get('REDIS_PORT') || '6379';
    const REDIS_PASSWORD = Deno.env.get('REDIS_PASSWORD');
    
    if (!REDIS_HOST) {
      console.warn('Redis not configured, proceeding without cache');
      return null;
    }
    
    try {
      redisClient = await connect({
        hostname: REDIS_HOST,
        port: parseInt(REDIS_PORT),
        password: REDIS_PASSWORD || undefined,
      });
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      return null;
    }
  }
  return redisClient;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CASINO_API_URL = Deno.env.get('DIAMOND_CASINO_API_URL')?.replace(/\/$/, ''); // Remove trailing slash
    const CASINO_API_KEY = Deno.env.get('DIAMOND_CASINO_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!CASINO_API_URL || !CASINO_API_KEY) {
      throw new Error('Casino API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const redis = await getRedisClient();
    
    // Hostinger proxy base URL for all casino API calls
    const HOSTINGER_PROXY_BASE = 'http://72.61.169.60:8000/api/casino';
    // Handle image proxy requests (GET requests with image path)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const imagePath = url.searchParams.get('image');
      
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://sitethemedata.com/',
              }
            });

            if (imageResponse.ok) {
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const imageData = await imageResponse.arrayBuffer();
              
              console.log(`✅ Image fetched successfully from: ${imageUrl} (${imageData.byteLength} bytes)`);
              
              return new Response(imageData, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400',
                  'X-Image-Source': imageUrl
                }
              });
            } else {
              console.log(`❌ Image URL returned ${imageResponse.status}: ${imageUrl}`);
            }
          } catch (error) {
            console.error(`Fetch error for ${imageUrl}:`, error);
          }
        }

        console.error(`❌ All image URLs failed for: ${imagePath}`);
        return new Response(JSON.stringify({ 
          error: 'Image not found', 
          path: imagePath,
          triedUrls: urlVariations
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Missing image parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle POST requests for API actions
    const { action, path, tableId, betData, date } = await req.json();
    const cacheKey = `casino:${action}:${tableId || 'all'}:${date || 'today'}`;

    console.log(`Casino API request: action=${action}, tableId=${tableId}`);

    // Try Redis cache for GET operations
    if (redis && ['get-tables', 'get-odds', 'get-result-history'].includes(action)) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`✅ Cache hit for ${action}`);
          return new Response(cached, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    let result;

    // Get live tables from Hostinger VPS proxy
    if (action === 'get-tables') {
      const HOSTINGER_PROXY_URL = 'http://72.61.169.60:8000/api/casino/tableid';
      console.log(`📡 Fetching tables from Hostinger proxy: ${HOSTINGER_PROXY_URL}`);
      
      const response = await fetch(HOSTINGER_PROXY_URL, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`📥 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response: ${errorText}`);
        throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      console.log(`📦 API Data type: ${typeof apiData}, isArray: ${Array.isArray(apiData)}`);
      console.log(`📦 API Data received:`, JSON.stringify(apiData).substring(0, 1000));
      
      // Casino image base URL
      const CASINO_IMAGE_BASE = 'https://sitethemedata.com/casino-games';
      
      // Handle response format: {"success":true,"msg":"Success","status":200,"data":{"t1":[...]}}
      let rawTables: any[] = [];
      
      if (Array.isArray(apiData)) {
        rawTables = apiData;
      } else if (apiData && typeof apiData === 'object') {
        // Check for t1 array inside data (common format from this API)
        if (apiData.data && Array.isArray(apiData.data.t1)) {
          rawTables = apiData.data.t1;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          rawTables = apiData.data;
        } else if (Array.isArray(apiData.tables)) {
          rawTables = apiData.tables;
        } else if (Array.isArray(apiData.result)) {
          rawTables = apiData.result;
        } else if (apiData.data && typeof apiData.data === 'object') {
          // data might be an object with arrays as values
          const dataArrays = Object.values(apiData.data).filter(Array.isArray);
          if (dataArrays.length > 0) {
            rawTables = dataArrays.flat();
          }
        }
      }
      
      console.log(`📦 Raw tables count: ${rawTables.length}`);
      
      const tables = rawTables.map((table: any) => {
        // Build full image URL from imgpath
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

      console.log(`✅ Processed ${tables.length} tables`);

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
          }, {
            onConflict: 'table_id'
          });
      }

      result = { success: true, data: { tables } };
    }

    // Get specific table details - use cached data from tables list
    else if (action === 'get-table' && tableId) {
      console.log(`📡 Fetching table details for: ${tableId}`);
      
      // Get table data from our database cache (populated by get-tables)
      const { data: cachedTable } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .eq('table_id', tableId)
        .single();
      
      if (cachedTable) {
        console.log(`✅ Found cached table data for: ${tableId}`);
        result = { success: true, data: cachedTable.table_data || { id: tableId, name: cachedTable.table_name } };
      } else {
        console.log(`⚠️ No cached data for table: ${tableId}`);
        result = { success: true, data: { id: tableId } };
      }
    }

    // Get live stream URL via Hostinger proxy
    else if (action === 'get-stream-url' && tableId) {
      console.log(`📡 Fetching stream URL for: ${tableId}`);
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const streamUrl = data.url || data.tv_url || data.stream_url || data.data?.url || data.data;
          console.log(`✅ Stream URL response:`, JSON.stringify(data).substring(0, 200));
          result = { success: true, data, streamUrl };
        } else {
          console.log(`⚠️ Stream URL API returned ${response.status} for: ${tableId}`);
          result = { success: true, data: null, streamUrl: null };
        }
      } catch (fetchError) {
        console.log(`⚠️ Stream URL fetch error for: ${tableId}`, fetchError);
        result = { success: true, data: null, streamUrl: null };
      }
    }

    // Get current result via Hostinger proxy
    else if (action === 'get-result' && tableId) {
      console.log(`📡 Fetching current result for: ${tableId}`);
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/result?id=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Result data for ${tableId}:`, JSON.stringify(data).substring(0, 300));
          result = { success: true, data };
        } else {
          console.log(`⚠️ Result API returned ${response.status} for: ${tableId}`);
          result = { success: true, data: null };
        }
      } catch (fetchError) {
        console.log(`⚠️ Result fetch error for: ${tableId}`, fetchError);
        result = { success: true, data: null };
      }
    }

    // Get result history via Hostinger proxy
    else if (action === 'get-result-history' && tableId) {
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`📡 Fetching result history for: ${tableId}, date: ${targetDate}`);
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/history?id=${tableId}&date=${targetDate}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ History data for ${tableId}:`, JSON.stringify(data).substring(0, 300));
          result = { success: true, data: Array.isArray(data) ? data : (data.data || []) };
        } else {
          console.log(`⚠️ History API returned ${response.status} for: ${tableId}`);
          result = { success: true, data: [] };
        }
      } catch (fetchError) {
        console.log(`⚠️ History fetch error for: ${tableId}`, fetchError);
        result = { success: true, data: [] };
      }
    }

    // Get table odds via Hostinger proxy
    else if (action === 'get-odds' && tableId) {
      console.log(`📡 Fetching odds for: ${tableId}`);
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/odds?id=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Odds data for ${tableId}:`, JSON.stringify(data).substring(0, 300));
          result = { success: true, data };
        } else {
          console.log(`⚠️ Odds API returned ${response.status} for: ${tableId}`);
          result = { success: true, data: null };
        }
      } catch (fetchError) {
        console.log(`⚠️ Odds fetch error for: ${tableId}`, fetchError);
        result = { success: true, data: null };
      }
    }

    // Get all casino table IDs from Hostinger VPS proxy
    else if (action === 'get-table-ids') {
      const HOSTINGER_PROXY_URL = 'http://72.61.169.60:8000/api';
      console.log(`📡 Fetching table IDs from Hostinger proxy: ${HOSTINGER_PROXY_URL}`);
      
      const response = await fetch(HOSTINGER_PROXY_URL, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Table IDs Error: ${errorText}`);
        throw new Error(`Failed to fetch table IDs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Table IDs data received:`, JSON.stringify(data).substring(0, 200));
      
      result = { success: true, data };
    }

    // Place bet
    else if (action === 'place-bet' && betData) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);

      if (!user) {
        throw new Error('Unauthorized');
      }

      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.current_balance < betData.amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from wallet
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: betData.amount,
        p_type: 'debit',
        p_reason: `Diamond Casino bet on ${betData.tableName}`,
        p_game_type: 'live_casino'
      });

      if (walletError) {
        throw new Error(`Wallet update failed: ${walletError.message}`);
      }

      // Place bet with casino API
      const betResponse = await fetch(`${CASINO_API_URL}/casino/place-bet`, {
        method: 'POST',
        headers: {
          'x-rapidapi-key': CASINO_API_KEY,
          'x-rapidapi-host': 'x-turnkeyxgaming-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: betData.tableId,
          amount: betData.amount,
          betType: betData.betType,
          roundId: betData.roundId,
          userId: user.id,
        })
      });

      if (!betResponse.ok) {
        // Refund on bet failure
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: betData.amount,
          p_type: 'credit',
          p_reason: 'Bet refund - API error',
          p_game_type: 'live_casino'
        });
        throw new Error(`Bet placement failed: ${betResponse.statusText}`);
      }

      const betResult = await betResponse.json();

      // Record bet
      const { data: bet, error: betError } = await supabase
        .from('diamond_casino_bets')
        .insert({
          user_id: user.id,
          table_id: betData.tableId,
          table_name: betData.tableName,
          bet_amount: betData.amount,
          bet_type: betData.betType,
          odds: betData.odds,
          round_id: betData.roundId,
          status: 'pending',
          external_bet_id: betResult.betId || betResult.id
        })
        .select()
        .single();

      if (betError) {
        // Refund if bet recording failed
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: betData.amount,
          p_type: 'credit',
          p_reason: 'Bet refund - recording failed',
          p_game_type: 'live_casino'
        });
        throw new Error(`Bet recording failed: ${betError.message}`);
      }

      console.log(`✅ Bet placed successfully: ${bet.id}`);

      result = { 
        success: true, 
        bet,
        message: 'Bet placed successfully' 
      };
    }

    else {
      throw new Error('Invalid action');
    }

    // Cache successful responses in Redis
    if (redis && result?.success && ['get-tables', 'get-odds', 'get-result-history'].includes(action)) {
      try {
        const ttl = action === 'get-tables' ? 300 : 60; // 5 min for tables, 1 min for others
        await redis.setex(cacheKey, ttl, JSON.stringify(result));
        console.log(`✅ Cached ${action} for ${ttl}s`);
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diamond Casino API error:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      action: 'unknown'
    };
    
    // Try to extract action from request if possible
    try {
      const url = new URL(req.url);
      if (url.searchParams.has('action')) {
        errorDetails.action = url.searchParams.get('action') || 'unknown';
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    console.error('Error details:', errorDetails);
    
    return new Response(JSON.stringify(errorDetails), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
