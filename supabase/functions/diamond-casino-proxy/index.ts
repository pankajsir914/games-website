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

    // Handle GET requests (image proxy only - NO stream proxy)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const imagePath = url.searchParams.get('image');
      
      // Image proxy only - stream proxy removed (Edge Functions not suitable for video streaming)
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
    const reqBody = await req.json();
    const { action, tableId, betData, date } = reqBody;
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
        // SIMPLE: Just return the stream URL from Hostinger proxy
        // NO PROXY - Edge Functions are not suitable for video streaming
        const hostingerStreamUrl = `${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`;
        
        const response = await fetch(hostingerStreamUrl, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📺 Stream URL response from Hostinger:`, JSON.stringify(data, null, 2));
          
          // Extract the actual stream URL from response
          const actualStreamUrl = data.url || data.tv_url || data.stream_url || data.data?.url || data.data?.tv_url || data.data || (typeof data === 'string' ? data : null);
          
          if (actualStreamUrl) {
            console.log(`✅ Stream URL: ${actualStreamUrl}`);
            // Return direct URL - frontend will use it directly
            result = { 
              success: true, 
              streamUrl: actualStreamUrl,
            };
          } else {
            throw new Error('No stream URL found in response');
          }
        } else {
          throw new Error(`Hostinger proxy returned ${response.status}`);
        }
      } catch (error: any) {
        console.error('Error fetching stream URL:', error);
        result = { 
          success: false, 
          error: error?.message || 'Failed to fetch stream URL' 
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

    // ============================================
    // PRODUCTION-READY BET SETTLEMENT SYSTEM
    // ============================================
    // Priority: Detailed Result API (PRIMARY) → Result API (FALLBACK)
    // Matching: Name-based (winnat/cname) - NOT numeric codes
    // Safety: Round-based matching, duplicate prevention, transaction safety
    // ============================================
    else if (action === 'process-bets' && tableId) {
      let resultData: any = null;
      let resultMid: string | null = null;
      let winnat: string | null = null;
      let win: string | null = null;
      let resultSource = 'none';

      // ============================================
      // STEP 1: FETCH RESULT (Detailed API → Fallback API)
      // ============================================
      
      // Get mid from request body or extract from latest result
      let mid = reqBody?.mid || null;
      
      // If mid not provided, extract from latest result API
      if (!mid) {
        try {
          const resultResponse = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (resultResponse.ok) {
            const resultJson = await resultResponse.json();
            const resData = resultJson?.data?.res || [];
            if (Array.isArray(resData) && resData.length > 0) {
              mid = resData[0]?.mid?.toString() || null;
              if (mid) {
                console.log(`✅ Extracted mid from latest result: ${mid}`);
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not extract mid from latest result');
        }
      }

      // PRIMARY: Try Detailed Result API first (most reliable)
      if (mid) {
        try {
          const detailUrl = `${HOSTINGER_PROXY_BASE}/detail_result?mid=${mid}&type=${tableId}`;
          console.log(`📡 [PRIMARY] Fetching detailed result: ${detailUrl}`);
          
          const detailResponse = await fetch(detailUrl, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (detailResponse.ok) {
            const detailJson = await detailResponse.json();
            resultData = detailJson?.data || detailJson;
            
            // Extract from detailed result API structure
            winnat = resultData?.winnat?.toString().trim() || null;
            win = resultData?.win?.toString().trim() || null;
            resultMid = resultData?.mid?.toString() || mid;
            resultSource = 'detailed_result_api';
            
            console.log('✅ [PRIMARY] Detailed result fetched:', {
              winnat: winnat || '(not found)',
              win: win || '(not found)',
              mid: resultMid
            });
          }
        } catch (error) {
          console.log('⚠️ Detailed result API failed, trying fallback');
        }
      }

      // FALLBACK: Use Regular Result API if detailed result not available
      if (!winnat && !win) {
        try {
          console.log('📡 [FALLBACK] Fetching regular result API');
          const resultResponse = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (resultResponse.ok) {
            const resultJson = await resultResponse.json();
            resultData = resultJson?.data || resultJson;
            
            // Extract from regular result API structure
            // res1.cname = winner name (winnat equivalent)
            winnat = resultData?.res1?.cname?.toString().trim() || null;
            
            // res[0].win = latest result code
            const resArray = resultData?.res || [];
            const latestRes = Array.isArray(resArray) && resArray.length > 0 ? resArray[0] : null;
            win = latestRes?.win?.toString().trim() || null;
            resultMid = latestRes?.mid?.toString() || mid;
            resultSource = 'result_api';
            
            console.log('✅ [FALLBACK] Regular result fetched:', {
              winnat: winnat || '(not found)',
              win: win || '(not found)',
              mid: resultMid
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Error fetching result:', errorMessage);
        }
      }

      // ============================================
      // STEP 2: VALIDATE RESULT DATA
      // ============================================
      
      // Use winnat as PRIMARY, win as FALLBACK (winnat is most reliable)
      const winningValue = winnat || win || '';

      if (!winningValue) {
        result = { 
          success: false, 
          error: 'No result available for settlement',
          debug: { resultData, winnat, win, resultSource, mid: resultMid }
        };
      } else {
        console.log('🎯 Final result extraction:', {
          winnat: winnat || '(not found)',
          win: win || '(not found)',
          winningValue,
          resultSource,
          resultMid
        });

        // ============================================
        // STEP 3: FETCH PENDING BETS (with round matching)
        // ============================================
        
        // Build query: pending bets for this table
        let betsQuery = supabase
          .from('diamond_casino_bets')
          .select('*')
          .eq('table_id', tableId)
          .eq('status', 'pending');

        // CRITICAL: Match by round_id (mid) if available to prevent wrong round settlement
        if (resultMid) {
          betsQuery = betsQuery.or(`round_id.eq.${resultMid},round_id.is.null`);
          console.log(`🔒 Round-based matching: Only processing bets with round_id=${resultMid} or null`);
        }

        const { data: pendingBets, error: betsError } = await betsQuery;

        if (betsError) {
          throw new Error(`Failed to fetch pending bets: ${betsError.message}`);
        }

        if (!pendingBets || pendingBets.length === 0) {
          result = { 
            success: true, 
            message: 'No pending bets to process',
            processed: 0,
            winningValue,
            resultSource
          };
        } else {
          console.log(`🔄 Processing ${pendingBets.length} pending bets for table ${tableId}`);

          // ============================================
          // STEP 4: FILTER BETS (time-based safety check)
          // ============================================
          
          // Additional safety: Filter bets placed before result (if timestamp available)
          const resultTimestamp = resultData?.time || resultData?.timestamp || null;
          let betsToProcess = pendingBets;
          
          if (resultTimestamp) {
            const resultTime = new Date(resultTimestamp).getTime();
            betsToProcess = pendingBets.filter(bet => {
              const betTime = new Date(bet.created_at).getTime();
              const isValid = betTime < resultTime;
              if (!isValid) {
                console.log(`⏭️ Skipping bet ${bet.id} - placed after result timestamp`);
              }
              return isValid;
            });
            console.log(`📊 Time-filtered: ${pendingBets.length} → ${betsToProcess.length} bets`);
          }

          if (betsToProcess.length === 0) {
            result = {
              success: true,
              message: 'No valid bets to process',
              processed: 0,
              won: 0,
              lost: 0,
              totalPayouts: 0,
              winningValue,
              resultSource
            };
          } else {
            // ============================================
            // STEP 5: SETTLE BETS (name-based matching)
            // ============================================
            
            let processed = 0;
            let won = 0;
            let lost = 0;
            let totalPayouts = 0;
            const winningValueLower = winningValue.toLowerCase().trim();

            for (const bet of betsToProcess) {
              try {
                // Skip if already processed (safety check)
                if (bet.status !== 'pending') {
                  console.log(`⏭️ Skipping bet ${bet.id} - already ${bet.status}`);
                  continue;
                }

                const betSide = bet.side || 'back';
                const betType = (bet.bet_type || '').toString().trim();
                const betTypeLower = betType.toLowerCase().trim();

                console.log(`\n🎲 Processing bet ${bet.id}:`, {
                  betType,
                  betTypeLower,
                  winnat: winnat || '(not found)',
                  win: win || '(not found)',
                  winningValue: winningValueLower,
                  betSide,
                  roundId: bet.round_id,
                  resultMid
                });

                // ============================================
                // SETTLEMENT RULES (Name-based matching)
                // ============================================
                // BACK bet: bet_type == winnat → WIN
                // LAY bet: bet_type ≠ winnat → WIN
                // ============================================
                
                let betWon = false;
                if (betSide === 'back') {
                  betWon = betTypeLower === winningValueLower;
                  console.log(`  ${betWon ? '✅' : '❌'} BACK: ${betWon ? 'MATCH (WINS)' : 'NO MATCH (LOSES)'}`);
                } else {
                  betWon = betTypeLower !== winningValueLower;
                  console.log(`  ${betWon ? '✅' : '❌'} LAY: ${betWon ? 'NO MATCH (WINS)' : 'MATCH (LOSES)'}`);
                }

                const newStatus = betWon ? 'won' : 'lost';
                const payoutAmount = betWon && bet.odds 
                  ? parseFloat((bet.bet_amount * bet.odds).toFixed(2))
                  : 0;

                // ============================================
                // STEP 6: UPDATE BET STATUS (atomic operation)
                // ============================================
                
                // Use .eq('status', 'pending') to prevent duplicate settlement
                const { error: updateError } = await supabase
                  .from('diamond_casino_bets')
                  .update({
                    status: newStatus,
                    payout_amount: payoutAmount,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', bet.id)
                  .eq('status', 'pending'); // CRITICAL: Only update if still pending

                if (updateError) {
                  console.error(`❌ Error updating bet ${bet.id}:`, updateError);
                  continue;
                }

                // ============================================
                // STEP 7: CREDIT WALLET (if won)
                // ============================================
                
                if (betWon && payoutAmount > 0) {
                  const { error: walletError } = await supabase.rpc('update_wallet_balance', {
                    p_user_id: bet.user_id,
                    p_amount: payoutAmount,
                    p_type: 'credit',
                    p_reason: `Diamond Casino win - ${bet.table_name || bet.table_id} (${bet.bet_type})`,
                    p_game_type: 'casino'
                  });

                  if (walletError) {
                    console.error(`❌ Error crediting wallet for bet ${bet.id}:`, walletError);
                  } else {
                    totalPayouts += payoutAmount;
                    won++;
                    console.log(`  💰 Wallet credited: ₹${payoutAmount}`);
                  }
                } else {
                  lost++;
                }

                processed++;
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`❌ Error processing bet ${bet.id}:`, errorMessage);
              }
            }

            // ============================================
            // STEP 8: RETURN SETTLEMENT SUMMARY
            // ============================================
            
            console.log(`\n📈 Settlement Summary:`, {
              processed,
              won,
              lost,
              totalPayouts,
              resultSource,
              winningValue
            });

            result = {
              success: true,
              message: `Processed ${processed} bets`,
              processed,
              won,
              lost,
              totalPayouts,
              winnat: winnat || null,
              win: win || null,
              winningValue,
              resultSource,
              resultMid: resultMid || null
            };
          }
        }
      }
    }
    else if (action === 'get-detail-result' && tableId) {
      // Get detailed result for a specific round
      const mid = reqBody?.mid;
      if (!mid) {
        result = { success: false, error: 'Missing mid parameter', data: null };
      } else {
        try {
          // Use the endpoint: detail_result?mid={mid}&type={type}
          // HOSTINGER_PROXY_BASE already includes /api/casino
          const detailUrl = `${HOSTINGER_PROXY_BASE}/detail_result?mid=${mid}&type=${tableId}`;
          console.log('📡 Fetching detail result from:', detailUrl);
          
          const response = await fetch(detailUrl, {
            headers: { 'Content-Type': 'application/json' }
          });

          console.log('📊 Detail result response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Detail result data received:', JSON.stringify(data, null, 2));
            result = { success: true, data };
          } else {
            const errorText = await response.text();
            console.error('❌ Detail result API error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            result = { success: false, error: `API returned ${response.status}`, data: null };
          }
        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error('❌ Error fetching detail result:', {
            tableId,
            mid,
            message: errorMessage
          });
          result = { success: false, error: errorMessage, data: null };
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
