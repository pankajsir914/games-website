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
    const RAPIDAPI_KEY = Deno.env.get('DIAMOND_CASINO_RAPIDAPI_KEY');
    const RAPIDAPI_HOST = 'diamond-casino-api-no-ggr.p.rapidapi.com';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!RAPIDAPI_KEY) {
      throw new Error('DIAMOND_CASINO_RAPIDAPI_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { action, path, tableId, betData, date } = await req.json();

    console.log(`Diamond Casino API request: action=${action}, path=${path}`);

    // Get live tables
    if (action === 'get-tables') {
      // Step 1: Get all table IDs
      const tableIdsResponse = await fetch(`https://${RAPIDAPI_HOST}/casino/tableid`, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });

      if (!tableIdsResponse.ok) {
        throw new Error(`Failed to fetch table IDs: ${tableIdsResponse.statusText}`);
      }

      const tableIds = await tableIdsResponse.json();
      console.log('Fetched table IDs:', tableIds);

      // Step 2: Fetch data for each table type
      const tables = [];
      for (const tableId of tableIds) {
        try {
          const tableDataResponse = await fetch(
            `https://${RAPIDAPI_HOST}/casino/data?type=${tableId}`,
            {
              headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
              }
            }
          );

          if (tableDataResponse.ok) {
            const tableData = await tableDataResponse.json();
            tables.push({
              id: tableId,
              name: tableData.gname || tableData.name || tableId,
              type: tableId,
              data: tableData,
              status: 'active',
              players: 0
            });
          }
        } catch (error) {
          console.error(`Error fetching data for table ${tableId}:`, error);
        }
      }

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

      return new Response(JSON.stringify({ success: true, data: { tables } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get specific table details
    if (action === 'get-table' && tableId) {
      const response = await fetch(`https://${RAPIDAPI_HOST}/casino/data?type=${tableId}`, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get live stream URL
    if (action === 'get-stream-url' && tableId) {
      const response = await fetch(`https://${RAPIDAPI_HOST}/casino/tv_url?id=${tableId}`, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stream URL: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ 
        success: true, 
        data,
        streamUrl: data.url || data.tv_url || data.stream_url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current result
    if (action === 'get-result' && tableId) {
      const response = await fetch(`https://${RAPIDAPI_HOST}/casino/result?type=${tableId}`, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch result: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get result history
    if (action === 'get-result-history' && tableId) {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/casino/resulthistory?type=${tableId}&date=${targetDate}`,
        {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch result history: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get table odds (from table data)
    if (action === 'get-odds' && tableId) {
      const response = await fetch(`https://${RAPIDAPI_HOST}/casino/data?type=${tableId}`, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data: { bets: data.t1 || [] } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Place bet
    if (action === 'place-bet' && betData) {
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
          status: 'pending'
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

      console.log(`Bet placed successfully: ${bet.id}`);

      return new Response(JSON.stringify({ 
        success: true, 
        bet,
        message: 'Bet placed successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Diamond Casino API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
