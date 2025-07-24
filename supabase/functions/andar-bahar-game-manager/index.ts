
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const value = rank === 'A' ? 1 : rank === 'J' ? 11 : rank === 'Q' ? 12 : rank === 'K' ? 13 : parseInt(rank);
      deck.push({ suit, rank, value });
    }
  }

  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

    const { action } = await req.json();

    if (action === 'start_new_round') {
      // Create a new game round
      const deck = shuffleDeck(createDeck());
      const jokerCard = deck[0];
      const remainingDeck = deck.slice(1);
      
      // Get the highest round number and increment
      const { data: lastRound } = await supabaseClient
        .from('andar_bahar_rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      const roundNumber = (lastRound?.round_number || 0) + 1;
      const betEndTime = new Date(Date.now() + 15000).toISOString(); // 15 seconds to bet

      const { data: newRound, error } = await supabaseClient
        .from('andar_bahar_rounds')
        .insert([{
          round_number: roundNumber,
          joker_card: jokerCard,
          andar_cards: [],
          bahar_cards: [],
          status: 'betting',
          bet_end_time: betEndTime
        }])
        .select()
        .single();

      if (error) throw error;

      console.log(`Started new round ${roundNumber} with joker:`, jokerCard);

      // Schedule the dealing process after betting period
      setTimeout(async () => {
        await dealCards(supabaseClient, newRound.id, jokerCard, remainingDeck);
      }, 15000);

      return new Response(
        JSON.stringify({ success: true, round: newRound }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function dealCards(supabaseClient: any, roundId: string, jokerCard: Card, deck: Card[]) {
  try {
    console.log(`Starting card dealing for round ${roundId}`);
    
    // Update round status to dealing
    await supabaseClient
      .from('andar_bahar_rounds')
      .update({ status: 'dealing' })
      .eq('id', roundId);

    const andarCards: Card[] = [];
    const baharCards: Card[] = [];
    let currentSide: 'andar' | 'bahar' = 'andar';
    let deckIndex = 0;
    let gameCompleted = false;
    let winningSide: 'andar' | 'bahar' | null = null;
    let winningCard: Card | null = null;

    // Deal cards alternately until we find a match
    while (deckIndex < deck.length && !gameCompleted) {
      const currentCard = deck[deckIndex];
      
      if (currentSide === 'andar') {
        andarCards.push(currentCard);
      } else {
        baharCards.push(currentCard);
      }

      // Check if this card matches the joker rank
      if (currentCard.rank === jokerCard.rank) {
        gameCompleted = true;
        winningSide = currentSide;
        winningCard = currentCard;
        console.log(`Game completed! ${winningSide} wins with card:`, currentCard);
      }

      // Update the round with current cards
      await supabaseClient
        .from('andar_bahar_rounds')
        .update({
          andar_cards: andarCards,
          bahar_cards: baharCards,
          ...(gameCompleted && {
            winning_side: winningSide,
            winning_card: winningCard,
            status: 'completed',
            game_end_time: new Date().toISOString()
          })
        })
        .eq('id', roundId);

      // Switch sides for next card
      currentSide = currentSide === 'andar' ? 'bahar' : 'andar';
      deckIndex++;

      // Add delay between cards for dramatic effect
      if (!gameCompleted) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (gameCompleted && winningSide) {
      // Process payouts
      await supabaseClient.rpc('process_andar_bahar_round', {
        p_round_id: roundId,
        p_winning_side: winningSide,
        p_winning_card: winningCard
      });

      console.log(`Payouts processed for round ${roundId}`);
    }

  } catch (error) {
    console.error('Error dealing cards:', error);
  }
}
