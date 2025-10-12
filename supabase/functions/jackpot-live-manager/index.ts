import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROUND_DURATION_SECONDS = 60;
const RESULT_DISPLAY_SECONDS = 5;
const COMMISSION_RATE = 0.05;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const now = new Date();

    // Check for active round
    const { data: activeRound, error: activeError } = await supabaseClient
      .from('jackpot_rounds')
      .select('*')
      .eq('status', 'active')
      .single();

    // If active round exists, check if it's expired
    if (activeRound && !activeError) {
      const endTime = new Date(activeRound.end_time);
      
      if (now > endTime) {
        console.log(`Completing expired round ${activeRound.id}`);
        
        // Complete the round
        const { data: completedData, error: completeError } = await supabaseClient
          .rpc('complete_jackpot_round', { p_round_id: activeRound.id });

        if (completeError) {
          console.error('Error completing round:', completeError);
        } else {
          console.log('Round completed:', completedData);
        }
      }

      // Get updated round data with entries
      const { data: roundData } = await supabaseClient
        .from('jackpot_rounds')
        .select(`
          *,
          entries:jackpot_entries(
            user_id,
            amount,
            win_probability,
            user:profiles!user_id(full_name)
          )
        `)
        .eq('id', activeRound.id)
        .single();

      const timeRemaining = Math.max(0, (new Date(roundData.end_time).getTime() - now.getTime()) / 1000);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'round_active',
          data: {
            active: roundData.status === 'active',
            round_id: roundData.id,
            total_amount: roundData.total_amount,
            total_players: roundData.total_players,
            end_time: roundData.end_time,
            time_remaining: timeRemaining,
            status: roundData.status,
            winner_id: roundData.winner_id,
            winner_amount: roundData.winner_amount,
            entries: roundData.entries?.map((entry: any) => ({
              user_id: entry.user_id,
              amount: entry.amount,
              win_probability: entry.win_probability,
              user_name: entry.user?.full_name || 'Anonymous'
            })) || []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check last completed round
    const { data: lastRound } = await supabaseClient
      .from('jackpot_rounds')
      .select('*, updated_at, status')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // If last round was completed less than RESULT_DISPLAY_SECONDS ago, wait
    if (lastRound) {
      const timeSinceCompletion = (now.getTime() - new Date(lastRound.updated_at).getTime()) / 1000;
      
      if (timeSinceCompletion < RESULT_DISPLAY_SECONDS) {
        console.log(`Waiting for result display: ${RESULT_DISPLAY_SECONDS - timeSinceCompletion}s remaining`);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'showing_result',
            data: {
              active: false,
              showing_result: true,
              result_time_remaining: RESULT_DISPLAY_SECONDS - timeSinceCompletion,
              last_winner_id: lastRound.winner_id,
              last_winner_amount: lastRound.winner_amount,
              last_round_pot: lastRound.total_amount
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create new round
    console.log('Creating new jackpot round...');
    
    const startTime = now;
    const endTime = new Date(now.getTime() + ROUND_DURATION_SECONDS * 1000);

    const { data: newRound, error: createError } = await supabaseClient
      .from('jackpot_rounds')
      .insert({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'active',
        total_amount: 0,
        total_players: 0,
        commission_rate: COMMISSION_RATE
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating round:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create new round', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('New round created:', newRound.id);

    return new Response(
      JSON.stringify({
        success: true,
        action: 'round_created',
        data: {
          active: true,
          round_id: newRound.id,
          total_amount: 0,
          total_players: 0,
          end_time: newRound.end_time,
          time_remaining: ROUND_DURATION_SECONDS,
          status: 'active',
          entries: []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Jackpot Live Manager Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
