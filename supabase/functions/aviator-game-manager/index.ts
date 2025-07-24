
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      aviator_rounds: {
        Row: {
          id: string;
          round_number: number;
          crash_multiplier: number;
          status: string;
          bet_start_time: string;
          bet_end_time: string;
          crash_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          round_number: number;
          crash_multiplier: number;
          bet_end_time: string;
        };
      };
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'create_round') {
      // Create a new round
      const lastRound = await supabaseClient
        .from('aviator_rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      const nextRoundNumber = (lastRound.data?.round_number || 0) + 1;
      
      // Generate random crash point between 1.01x and 50x
      const generateCrashPoint = () => {
        const random = Math.random();
        if (random < 0.5) return 1.01 + Math.random() * 1.49; // 50% chance: 1.01x - 2.5x
        if (random < 0.8) return 2.5 + Math.random() * 7.5; // 30% chance: 2.5x - 10x
        return 10 + Math.random() * 40; // 20% chance: 10x - 50x
      };

      const crashMultiplier = generateCrashPoint();
      const now = new Date();
      
      // Set betting period to 7 seconds from now
      const betEndTime = new Date(now.getTime() + 7000);

      const { data: newRound, error } = await supabaseClient
        .from('aviator_rounds')
        .insert({
          round_number: nextRoundNumber,
          crash_multiplier: Number(crashMultiplier.toFixed(3)),
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

    if (action === 'start_flying') {
      const roundId = url.searchParams.get('round_id');
      
      if (!roundId) {
        throw new Error('Round ID is required');
      }

      // Update round status to flying
      const { error } = await supabaseClient
        .from('aviator_rounds')
        .update({ 
          status: 'flying',
          updated_at: new Date().toISOString()
        })
        .eq('id', roundId)
        .eq('status', 'betting');

      if (error) {
        console.error('Error starting flight:', error);
        throw error;
      }

      console.log('Started flying phase for round:', roundId);

      return new Response(
        JSON.stringify({ success: true, round_id: roundId }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'crash_round') {
      const roundId = url.searchParams.get('round_id');
      
      if (!roundId) {
        throw new Error('Round ID is required');
      }

      // Get the round details to get crash multiplier
      const { data: round, error: roundError } = await supabaseClient
        .from('aviator_rounds')
        .select('*')
        .eq('id', roundId)
        .eq('status', 'flying')
        .single();

      if (roundError || !round) {
        throw new Error('Round not found or not in flying state');
      }

      // Process the round crash
      const { data: result, error: processError } = await supabaseClient
        .rpc('process_aviator_crash', {
          p_round_id: roundId,
          p_crash_multiplier: round.crash_multiplier,
        });

      if (processError) {
        console.error('Error processing crash:', processError);
        throw processError;
      }

      console.log('Processed crash for round:', result);

      return new Response(
        JSON.stringify({ success: true, result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'auto_manage') {
      // Check for rounds that need to start flying (betting time ended)
      const { data: bettingRounds, error: bettingError } = await supabaseClient
        .from('aviator_rounds')
        .select('*')
        .eq('status', 'betting')
        .lt('bet_end_time', new Date().toISOString());

      if (bettingError) {
        console.error('Error fetching betting rounds:', bettingError);
        throw bettingError;
      }

      // Start flying phase for expired betting rounds
      for (const round of bettingRounds || []) {
        try {
          await supabaseClient
            .from('aviator_rounds')
            .update({ 
              status: 'flying',
              updated_at: new Date().toISOString()
            })
            .eq('id', round.id);

          console.log(`Started flying phase for round ${round.id}`);
        } catch (error) {
          console.error(`Error starting flight for round ${round.id}:`, error);
        }
      }

      // Check if we need to create a new round
      const { data: activeRounds, error: activeError } = await supabaseClient
        .from('aviator_rounds')
        .select('*')
        .in('status', ['betting', 'flying']);

      if (activeError) {
        console.error('Error fetching active rounds:', activeError);
        throw activeError;
      }

      // Create new round if no active rounds exist
      if (!activeRounds || activeRounds.length === 0) {
        const lastRound = await supabaseClient
          .from('aviator_rounds')
          .select('round_number')
          .order('round_number', { ascending: false })
          .limit(1)
          .single();

        const nextRoundNumber = (lastRound.data?.round_number || 0) + 1;
        
        const generateCrashPoint = () => {
          const random = Math.random();
          if (random < 0.5) return 1.01 + Math.random() * 1.49;
          if (random < 0.8) return 2.5 + Math.random() * 7.5;
          return 10 + Math.random() * 40;
        };

        const crashMultiplier = generateCrashPoint();
        const now = new Date();
        const betEndTime = new Date(now.getTime() + 7000);

        const { data: newRound, error: createError } = await supabaseClient
          .from('aviator_rounds')
          .insert({
            round_number: nextRoundNumber,
            crash_multiplier: Number(crashMultiplier.toFixed(3)),
            bet_end_time: betEndTime.toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new round:', createError);
        } else {
          console.log('Created new round automatically:', newRound);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Auto management completed' }),
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
    console.error('Error in aviator-game-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
