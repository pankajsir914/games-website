import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CASINO_API_URL = Deno.env.get('DIAMOND_CASINO_API_URL')?.replace(/\/$/, '');
    const CASINO_API_KEY = Deno.env.get('DIAMOND_CASINO_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!CASINO_API_URL || !CASINO_API_KEY) {
      throw new Error('Casino API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
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
      
      return new Response(JSON.stringify({ error: 'Missing image parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle POST requests for API actions
    const { action, tableId, betData, date } = await req.json();
    console.log(`Casino API request: action=${action}, tableId=${tableId}`);

    let result;

    // Get live tables from Hostinger VPS proxy
    if (action === 'get-tables') {
      const HOSTINGER_PROXY_URL = 'http://72.61.169.60:8000/api/casino/tableid';
      console.log(`📡 Fetching tables from: ${HOSTINGER_PROXY_URL}`);
      
      const response = await fetch(HOSTINGER_PROXY_URL, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status}`);
      }

      const apiData = await response.json();
      const CASINO_IMAGE_BASE = 'https://sitethemedata.com/casino-games';
      
      let rawTables: any[] = [];
      
      if (Array.isArray(apiData)) {
        rawTables = apiData;
      } else if (apiData?.data?.t1) {
        rawTables = apiData.data.t1;
      } else if (Array.isArray(apiData?.data)) {
        rawTables = apiData.data;
      }
      
      const tables = rawTables.map((table: any) => {
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

      result = { success: true, data: { tables } };
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
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const streamUrl = data.url || data.tv_url || data.stream_url || data.data?.url || data.data;
          result = { success: true, data, streamUrl };
        } else {
          result = { success: true, data: null, streamUrl: null };
        }
      } catch (fetchError) {
        result = { success: true, data: null, streamUrl: null };
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
        result = { success: true, data: [] };
      }
    }

    // Get table odds
    else if (action === 'get-odds' && tableId) {
      console.log(`📡 Fetching odds for: ${tableId}`);
      try {
        // Get gmid from tableid endpoint
        let gmid = tableId;
        
        const tableIdResponse = await fetch(`${HOSTINGER_PROXY_BASE}/tableid?id=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (tableIdResponse.ok) {
          const tableIdData = await tableIdResponse.json();
          const extractedGmid = tableIdData?.data?.gmid || tableIdData?.gmid || 
                               tableIdData?.data?.mid || tableIdData?.mid;
          if (extractedGmid) gmid = extractedGmid;
        }
        
        // Fetch odds from data endpoint
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/data?type=${tableId}&id=${gmid}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const oddsData = data?.data || data;
          const bettingOptions: any[] = [];
          
          // Parse sub, t1, t2, t3 arrays for betting options
          ['sub', 't1', 't2', 't3'].forEach((key) => {
            if (oddsData[key] && Array.isArray(oddsData[key])) {
              oddsData[key].forEach((item: any) => {
                if (item.nat || item.nation || item.name) {
                  bettingOptions.push({
                    type: item.nat || item.nation || item.name,
                    back: parseFloat(item.b1 || item.b || '0') || 0,
                    lay: parseFloat(item.l1 || item.l || '0') || 0,
                    status: item.gstatus === 'SUSPENDED' || item.gstatus === '0' ? 'suspended' : 'active',
                    min: item.min || 100,
                    max: item.max || 100000,
                    sid: item.sid,
                    mid: oddsData.mid || item.mid,
                    subtype: item.subtype,
                    etype: item.etype,
                  });
                }
              });
            }
          });
          
          result = { success: true, data: { bets: bettingOptions, raw: oddsData } };
        } else {
          result = { success: true, data: null };
        }
      } catch (fetchError) {
        console.log(`⚠️ Odds fetch error:`, fetchError);
        result = { success: true, data: null };
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

    // Place bet
    else if (action === 'place-bet' && betData) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) throw new Error('No authorization header');

      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) throw new Error('Unauthorized');

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

      if (walletError) throw new Error(`Wallet update failed: ${walletError.message}`);

      // Place bet with casino API
      const betResponse = await fetch(`${CASINO_API_URL}/casino/place-bet`, {
        method: 'POST',
        headers: {
          'x-rapidapi-key': CASINO_API_KEY,
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
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: betData.amount,
          p_type: 'credit',
          p_reason: 'Bet refund - API error',
          p_game_type: 'live_casino'
        });
        throw new Error(`Bet placement failed`);
      }

      const betResult = await betResponse.json();

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
        })
        .select()
        .single();

      if (betError) {
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: betData.amount,
          p_type: 'credit',
          p_reason: 'Bet refund - recording failed',
          p_game_type: 'live_casino'
        });
        throw new Error(`Bet recording failed`);
      }

      result = { success: true, bet, message: 'Bet placed successfully' };
    }

    else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diamond Casino API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
