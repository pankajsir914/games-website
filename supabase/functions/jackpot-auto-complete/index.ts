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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin operations
    );

    console.log('Jackpot Auto-Complete - Checking for expired rounds...');

    // Find expired rounds
    const { data: expiredRounds, error: findError } = await supabaseClient
      .from('jackpot_rounds')
      .select('id, total_amount, total_players')
      .eq('status', 'active')
      .lt('end_time', new Date().toISOString());

    if (findError) {
      console.error('Error finding expired rounds:', findError);
      return new Response(
        JSON.stringify({ error: 'Failed to find expired rounds' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Complete each expired round
    for (const round of expiredRounds || []) {
      console.log(`Completing round ${round.id} with ${round.total_players} players and ₹${round.total_amount} pot`);
      
      try {
        const { data, error } = await supabaseClient.rpc('complete_jackpot_round', {
          p_round_id: round.id
        });

        if (error) {
          console.error(`Error completing round ${round.id}:`, error);
          results.push({
            round_id: round.id,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Successfully completed round ${round.id}:`, data);
          results.push({
            round_id: round.id,
            success: true,
            data
          });
        }
      } catch (roundError) {
        console.error(`Exception completing round ${round.id}:`, roundError);
        results.push({
          round_id: round.id,
          success: false,
          error: roundError.message
        });
      }
    }

    console.log(`Processed ${results.length} expired rounds`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_rounds: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Jackpot Auto-Complete Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});