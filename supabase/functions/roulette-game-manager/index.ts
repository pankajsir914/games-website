
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      roulette_rounds: {
        Row: {
          id: string;
          round_number: number;
          winning_number?: number;
          winning_color?: string;
          status: string;
          bet_end_time: string;
          spin_end_time?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          round_number: number;
          status?: string;
          bet_end_time: string;
        };
        Update: {
          winning_number?: number;
          winning_color?: string;
          status?: string;
          spin_end_time?: string;
          updated_at?: string;
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

    const { action } = await req.json();

    // For create_round and spin_wheel actions, verify master admin access
    if (action === 'create_round' || action === 'spin_wheel') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Authorization required for admin actions' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      // Verify user and check master admin status
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (userError || !user) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Authentication failed' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      // Check if user is master admin
      const { data: isMasterAdmin, error: roleError } = await supabaseClient.rpc('is_master_admin_user', {
        _user_id: user.id
      });
      
      if (roleError || !isMasterAdmin) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Master admin privileges required for game management' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        });
      }
    }

    // Check if game is paused
    const { data: gameSettings } = await supabaseClient
      .from('game_settings')
      .select('is_paused')
      .eq('game_type', 'roulette')
      .single();
    
    if (gameSettings?.is_paused && action !== 'create_round') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Roulette game is currently paused' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    switch (action) {
      case 'create_round':
        return await createNewRound(supabaseClient);
      case 'spin_wheel':
        return await spinWheel(supabaseClient);
      case 'auto_manage':
        return await autoManageRounds(supabaseClient);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createNewRound(supabase: any) {
  console.log('Creating new roulette round...');

  // Get the highest round number
  const { data: lastRound } = await supabase
    .from('roulette_rounds')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1)
    .single();

  const nextRoundNumber = (lastRound?.round_number || 0) + 1;
  const bettingDuration = 30; // 30 seconds for betting
  const betEndTime = new Date(Date.now() + bettingDuration * 1000).toISOString();

  const { data: newRound, error } = await supabase
    .from('roulette_rounds')
    .insert({
      round_number: nextRoundNumber,
      status: 'betting',
      bet_end_time: betEndTime,
    })
    .select()
    .single();

  if (error) throw error;

  console.log(`Created round ${nextRoundNumber}`);

  return new Response(
    JSON.stringify({
      success: true,
      round: newRound,
      message: `Round ${nextRoundNumber} created successfully`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function spinWheel(supabase: any) {
  console.log('Processing wheel spin...');

  // Find the current betting round
  const { data: currentRound, error: roundError } = await supabase
    .from('roulette_rounds')
    .select('*')
    .eq('status', 'betting')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (roundError || !currentRound) {
    throw new Error('No active betting round found');
  }

  // Check if betting period has ended
  const now = new Date();
  const betEndTime = new Date(currentRound.bet_end_time);
  
  if (now < betEndTime) {
    throw new Error('Betting period has not ended yet');
  }

  // Generate secure random winning number (0-36) using crypto.randomInt
  const crypto = globalThis.crypto;
  const winningNumber = crypto.getRandomValues(new Uint32Array(1))[0] % 37;
  
  console.log(`Round ${currentRound.round_number}: Winning number is ${winningNumber}`);

  // Update round to spinning status
  const { error: updateError } = await supabase
    .from('roulette_rounds')
    .update({ 
      status: 'spinning',
      updated_at: new Date().toISOString()
    })
    .eq('id', currentRound.id);

  if (updateError) throw updateError;

  // Wait for spin animation (4 seconds)
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Process the round with the winning number
  const { data: result, error: processError } = await supabase
    .rpc('process_roulette_round', {
      p_round_id: currentRound.id,
      p_winning_number: winningNumber
    });

  if (processError) throw processError;

  console.log(`Round ${currentRound.round_number} completed:`, result);

  return new Response(
    JSON.stringify({
      success: true,
      round_id: currentRound.id,
      round_number: currentRound.round_number,
      winning_number: winningNumber,
      result: result
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function autoManageRounds(supabase: any) {
  console.log('Auto-managing roulette rounds...');

  // Check for active rounds
  const { data: activeRounds } = await supabase
    .from('roulette_rounds')
    .select('*')
    .in('status', ['betting', 'spinning'])
    .order('created_at', { ascending: false });

  const now = new Date();
  let actions = [];

  for (const round of activeRounds || []) {
    const betEndTime = new Date(round.bet_end_time);
    
    if (round.status === 'betting' && now >= betEndTime) {
      // Betting period ended, spin the wheel
      console.log(`Auto-spinning round ${round.round_number}`);
      
      try {
        // Generate secure random number
        const crypto = globalThis.crypto;
        const winningNumber = crypto.getRandomValues(new Uint32Array(1))[0] % 37;
        
        // Update to spinning
        await supabase
          .from('roulette_rounds')
          .update({ 
            status: 'spinning',
            updated_at: now.toISOString()
          })
          .eq('id', round.id);

        // Process after delay
        setTimeout(async () => {
          await supabase.rpc('process_roulette_round', {
            p_round_id: round.id,
            p_winning_number: winningNumber
          });
        }, 4000);

        actions.push(`Round ${round.round_number}: Started spinning (winning: ${winningNumber})`);
      } catch (error) {
        console.error(`Error spinning round ${round.round_number}:`, error);
        actions.push(`Round ${round.round_number}: Error spinning - ${error.message}`);
      }
    }
  }

  // Check if we need to create a new round
  const { data: latestRound } = await supabase
    .from('roulette_rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const shouldCreateNewRound = !latestRound || 
    (latestRound.status === 'completed' || 
     (latestRound.status === 'betting' && now >= new Date(latestRound.bet_end_time)));

  if (shouldCreateNewRound) {
    try {
      const nextRoundNumber = (latestRound?.round_number || 0) + 1;
      const betEndTime = new Date(now.getTime() + 30000).toISOString(); // 30 seconds from now

      const { data: newRound } = await supabase
        .from('roulette_rounds')
        .insert({
          round_number: nextRoundNumber,
          status: 'betting',
          bet_end_time: betEndTime,
        })
        .select()
        .single();

      actions.push(`Created new round ${nextRoundNumber}`);
    } catch (error) {
      console.error('Error creating new round:', error);
      actions.push(`Error creating new round: ${error.message}`);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      actions: actions,
      message: `Auto-management completed. ${actions.length} actions taken.`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
