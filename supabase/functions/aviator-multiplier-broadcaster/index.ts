import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current flying round
    const { data: flyingRound, error } = await supabaseClient
      .from('aviator_rounds')
      .select('*')
      .eq('status', 'flying')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !flyingRound) {
      return new Response(
        JSON.stringify({ success: true, multiplier: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate current multiplier based on elapsed time
    // Match frontend calculation: 0.2x per second
    const betEndTime = new Date(flyingRound.bet_end_time).getTime();
    const elapsed = (Date.now() - betEndTime) / 1000; // seconds since flight started
    const currentMultiplier = Math.min(1 + (elapsed * 0.2), flyingRound.crash_multiplier);

    // Broadcast multiplier update via Realtime
    const channelName = `aviator-${flyingRound.id}`;
    const channel = supabaseClient.channel(channelName);
    
    // Subscribe to channel before sending broadcast
    const subscribePromise = new Promise((resolve, reject) => {
      channel
        .on('broadcast', { event: 'multiplier' }, () => {}) // Dummy listener
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(status);
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Channel subscription failed'));
          }
        });
    });
    
    try {
      await subscribePromise;
      
      // Send broadcast
      const { error: sendError } = await channel.send({
        type: 'broadcast',
        event: 'multiplier',
        payload: {
          multiplier: currentMultiplier,
          round_id: flyingRound.id,
          timestamp: Date.now()
        }
      });
      
      if (sendError) {
        console.error('Error sending broadcast:', sendError);
      }
      
      // Clean up channel
      await supabaseClient.removeChannel(channel);
    } catch (error) {
      console.error('Error in channel subscription:', error);
      await supabaseClient.removeChannel(channel);
    }

    console.log(`Broadcast multiplier ${currentMultiplier.toFixed(2)}x for round ${flyingRound.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        multiplier: currentMultiplier,
        round_id: flyingRound.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in multiplier broadcaster:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
