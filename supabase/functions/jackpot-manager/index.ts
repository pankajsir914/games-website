import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    console.log(`Jackpot Manager - ${method} ${path}`);

    // GET /jackpot/current - Get current round info
    if (method === 'GET' && path.endsWith('/current')) {
      const { data, error } = await supabaseClient.rpc('get_current_jackpot_round');
      
      if (error) {
        console.error('Error getting current round:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get current round' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /jackpot/join - Join current round
    if (method === 'POST' && path.endsWith('/join')) {
      const { amount } = await req.json();

      if (!amount || amount < 1) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount. Minimum bet is ₹1' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient.rpc('join_jackpot_round', {
        p_amount: amount
      });

      if (error) {
        console.error('Error joining round:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /jackpot/history - Get jackpot history
    if (method === 'GET' && path.endsWith('/history')) {
      const { data, error } = await supabaseClient
        .from('jackpot_rounds')
        .select(`
          *,
          winner:profiles!winner_id(full_name),
          entries:jackpot_entries(
            amount,
            win_probability,
            user:profiles!user_id(full_name)
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error getting history:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get history' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /jackpot/complete/:roundId - Complete a round (admin only)
    if (method === 'POST' && path.includes('/complete/')) {
      const roundId = path.split('/').pop();
      
      if (!roundId) {
        return new Response(
          JSON.stringify({ error: 'Round ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient.rpc('complete_jackpot_round', {
        p_round_id: roundId
      });

      if (error) {
        console.error('Error completing round:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /wallet/balance - Get user wallet balance
    if (method === 'GET' && path.endsWith('/wallet/balance')) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('wallets')
        .select('current_balance, locked_balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error getting wallet balance:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get wallet balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /wallet/deposit - Test deposit (for testing only)
    if (method === 'POST' && path.endsWith('/wallet/deposit')) {
      const { amount } = await req.json();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_type: 'credit',
        p_reason: 'Test deposit'
      });

      if (error) {
        console.error('Error depositing:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Jackpot Manager Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});