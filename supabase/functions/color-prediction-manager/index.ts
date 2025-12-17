
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameSettings {
  round_duration?: number;
  result_display_time?: number;
  cheat_mode?: boolean;
  forced_color?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Fetch game settings
    const { data: gameSettingsData } = await supabaseClient
      .from('game_settings')
      .select('is_paused, settings')
      .eq('game_type', 'color_prediction')
      .single();
    
    const gameSettings: GameSettings = gameSettingsData?.settings || {};
    const roundDuration = gameSettings.round_duration || 30; // Default 30 seconds
    const resultDisplayTime = gameSettings.result_display_time || 5; // Default 5 seconds
    
    console.log(`Settings: roundDuration=${roundDuration}s, resultDisplayTime=${resultDisplayTime}s`);
    
    if (gameSettingsData?.is_paused && action !== 'create_round') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Color Prediction game is currently paused' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }
    
    if (action === 'create_round') {
      // Create a new round
      const lastRound = await supabaseClient
        .from('color_prediction_rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRoundNumber = (lastRound.data?.round_number || 0) + 1;
      const now = new Date();
      const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(nextRoundNumber).padStart(3, '0')}`;
      
      // Use dynamic round duration from settings
      const betEndTime = new Date(now.getTime() + (roundDuration * 1000));

      const { data: newRound, error } = await supabaseClient
        .from('color_prediction_rounds')
        .insert({
          round_number: nextRoundNumber,
          period: period,
          bet_end_time: betEndTime.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating round:', error);
        throw error;
      }

      console.log('Created new round:', newRound);

      return new Response(
        JSON.stringify({ success: true, round: newRound }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'process_round') {
      const roundId = url.searchParams.get('round_id');
      
      if (!roundId) {
        throw new Error('Round ID is required');
      }

      // Get the round to process
      const { data: round, error: roundError } = await supabaseClient
        .from('color_prediction_rounds')
        .select('*')
        .eq('id', roundId)
        .eq('status', 'betting')
        .maybeSingle();

      if (roundError || !round) {
        throw new Error('Round not found or already processed');
      }

      // Update round status to drawing
      await supabaseClient
        .from('color_prediction_rounds')
        .update({ status: 'drawing' })
        .eq('id', roundId);

      // Generate random winning color (weighted: red=45%, green=45%, violet=10%)
      const random = Math.random();
      let winningColor: string;
      
      if (random < 0.45) {
        winningColor = 'red';
      } else if (random < 0.90) {
        winningColor = 'green';
      } else {
        winningColor = 'violet';
      }

      // Process the round with the winning color
      const { data: result, error: processError } = await supabaseClient
        .rpc('process_color_prediction_round', {
          p_round_id: roundId,
          p_winning_color: winningColor,
        });

      if (processError) {
        console.error('Error processing round:', processError);
        throw processError;
      }

      console.log('Processed round:', result);

      return new Response(
        JSON.stringify({ success: true, result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'auto_manage') {
      console.log('Auto-manage called at:', new Date().toISOString());
      
      // Check for rounds that need processing (betting time ended)
      const { data: expiredRounds, error: expiredError } = await supabaseClient
        .from('color_prediction_rounds')
        .select('*')
        .eq('status', 'betting')
        .lt('bet_end_time', new Date().toISOString());

      if (expiredError) {
        console.error('Error fetching expired rounds:', expiredError);
        throw expiredError;
      }

      console.log(`Found ${expiredRounds?.length || 0} expired rounds to process`);

      // Process expired rounds
      for (const round of expiredRounds || []) {
        try {
          console.log(`Processing expired round ${round.id}`);
          
          // If this is a stuck round (been in betting/drawing state for too long)
          const roundAge = Date.now() - new Date(round.bet_end_time).getTime();
          
          // Force completion for stuck rounds (over 2 minutes old - reduced from 5)
          if (roundAge > 120000) {
            console.log(`Force completing stuck round ${round.id} (${Math.floor(roundAge / 1000)}s old)`);
            const { error: updateError } = await supabaseClient
              .from('color_prediction_rounds')
              .update({
                status: 'completed',
                winning_color: 'green', // Default to green for stuck rounds
                draw_time: new Date().toISOString()
              })
              .eq('id', round.id);
              
            if (updateError) {
              console.error(`Error force completing round ${round.id}:`, updateError);
            }
            continue;
          }
          
          const cheatMode = gameSettings?.cheat_mode || false;
          let winningColor: string;
          
          if (cheatMode && gameSettings?.forced_color) {
            // Use forced color in cheat mode
            winningColor = gameSettings.forced_color;
            console.log(`Using forced color in cheat mode: ${winningColor}`);
          } else {
            // Generate random winning color (weighted: red=45%, green=45%, violet=10%)
            const random = Math.random();
            
            if (random < 0.45) {
              winningColor = 'red';
            } else if (random < 0.90) {
              winningColor = 'green';
            } else {
              winningColor = 'violet';
            }
            console.log(`Generated random color: ${winningColor} (random: ${random})`);
          }

          // Update round status to drawing
          await supabaseClient
            .from('color_prediction_rounds')
            .update({ status: 'drawing' })
            .eq('id', round.id);

          // Process the round with the winning color
          const { data: result, error: processError } = await supabaseClient
            .rpc('process_color_prediction_round', {
              p_round_id: round.id,
              p_winning_color: winningColor,
            });

          if (processError) {
            console.error(`Error processing round ${round.id}:`, processError);
            throw processError;
          }

          console.log(`Successfully processed round ${round.id} with color ${winningColor}, result:`, result);
        } catch (error) {
          console.error(`Failed to process round ${round.id}:`, error);
        }
      }

      // Check if we need to create a new round
      const { data: activeRounds, error: activeError } = await supabaseClient
        .from('color_prediction_rounds')
        .select('*')
        .in('status', ['betting', 'drawing']);

      if (activeError) {
        console.error('Error fetching active rounds:', activeError);
        throw activeError;
      }

      console.log(`Found ${activeRounds?.length || 0} active rounds`);

      // Create new round if no active rounds exist
      if (!activeRounds || activeRounds.length === 0) {
        // Check last completed round to ensure result display time
        const { data: lastCompletedRound } = await supabaseClient
          .from('color_prediction_rounds')
          .select('*')
          .eq('status', 'completed')
          .order('draw_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Use dynamic result display time from settings
        if (lastCompletedRound?.draw_time) {
          const timeSinceCompletion = Date.now() - new Date(lastCompletedRound.draw_time).getTime();
          const minDisplayTime = resultDisplayTime * 1000; // Convert to ms
          
          if (timeSinceCompletion < minDisplayTime) {
            console.log(`Waiting for result display (${Math.floor(timeSinceCompletion / 1000)}s / ${resultDisplayTime}s)`);
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Waiting for result display',
                waiting_time: Math.ceil((minDisplayTime - timeSinceCompletion) / 1000),
                processed_rounds: expiredRounds?.length || 0,
                active_rounds: 0
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            );
          }
        }

        console.log('No active rounds found, creating new round...');
        
        try {
          const lastRound = await supabaseClient
            .from('color_prediction_rounds')
            .select('round_number')
            .order('round_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextRoundNumber = (lastRound.data?.round_number || 0) + 1;
          const now = new Date();
          const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(nextRoundNumber).padStart(3, '0')}`;
          
          // Use dynamic round duration from settings
          const betEndTime = new Date(now.getTime() + (roundDuration * 1000));

          const { data: newRound, error: createError } = await supabaseClient
            .from('color_prediction_rounds')
            .insert({
              round_number: nextRoundNumber,
              period: period,
              bet_end_time: betEndTime.toISOString(),
            })
            .select()
            .single();

          if (createError) {
            // Handle duplicate key error gracefully (race condition)
            if (createError.code === '23505') {
              console.log('Round already created by another process, skipping...');
            } else {
              console.error('Error creating new round:', createError);
              throw createError;
            }
          } else {
            console.log('Created new round automatically:', newRound);
          }
        } catch (error) {
          console.error('Failed to create new round:', error);
          // Don't throw - just log and continue
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auto management completed',
          processed_rounds: expiredRounds?.length || 0,
          active_rounds: activeRounds?.length || 0,
          settings: { roundDuration, resultDisplayTime }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // New action to get current settings
    if (action === 'get_settings') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          settings: { 
            roundDuration, 
            resultDisplayTime,
            isPaused: gameSettingsData?.is_paused || false
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('Error in color-prediction-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
