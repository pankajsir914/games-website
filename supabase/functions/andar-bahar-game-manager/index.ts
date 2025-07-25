import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a deck of cards
function createDeck(): Card[] {
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
}

// Shuffle deck using Fisher-Yates algorithm
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    
    // If no action in query params, try to get from body
    if (!action && req.method === 'POST') {
      try {
        const body = await req.json();
        action = body.action;
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (action === 'start_new_round') {
      // Create a new round
      const deck = shuffleDeck(createDeck());
      const jokerCard = deck[0]; // First card is joker
      
      // Get the last round number
      const { data: lastRound } = await supabaseClient
        .from('andar_bahar_rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();
      
      const newRoundNumber = (lastRound?.round_number || 0) + 1;
      
      // Get game settings for cheat mode
      const { data: gameSettings } = await supabaseClient
        .from('game_settings')
        .select('settings')
        .eq('game_type', 'andar_bahar')
        .single();
      
      const settings = gameSettings?.settings || {};
      const bettingDuration = settings.betting_duration || 30;
      
      // Create new round
      const { data: newRound, error } = await supabaseClient
        .from('andar_bahar_rounds')
        .insert({
          round_number: newRoundNumber,
          joker_card: jokerCard,
          andar_cards: [],
          bahar_cards: [],
          status: 'betting',
          bet_end_time: new Date(Date.now() + bettingDuration * 1000).toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Schedule card dealing after betting period
      setTimeout(() => {
        dealCards(supabaseClient, newRound.id, jokerCard, deck.slice(1), settings);
      }, bettingDuration * 1000);
      
      return new Response(JSON.stringify({ success: true, round: newRound }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'auto_manage') {
      // Check if there's an active round
      const { data: activeRound } = await supabaseClient
        .from('andar_bahar_rounds')
        .select('*')
        .in('status', ['betting', 'dealing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!activeRound) {
        // Create a new round if none exists
        const deck = shuffleDeck(createDeck());
        const jokerCard = deck[0];
        
        const { data: lastRound } = await supabaseClient
          .from('andar_bahar_rounds')
          .select('round_number')
          .order('round_number', { ascending: false })
          .limit(1)
          .single();
        
        const newRoundNumber = (lastRound?.round_number || 0) + 1;
        
        const { data: gameSettings } = await supabaseClient
          .from('game_settings')
          .select('settings')
          .eq('game_type', 'andar_bahar')
          .single();
        
        const settings = gameSettings?.settings || {};
        const bettingDuration = settings.betting_duration || 30;
        
        const { data: newRound } = await supabaseClient
          .from('andar_bahar_rounds')
          .insert({
            round_number: newRoundNumber,
            joker_card: jokerCard,
            andar_cards: [],
            bahar_cards: [],
            status: 'betting',
            bet_end_time: new Date(Date.now() + bettingDuration * 1000).toISOString()
          })
          .select()
          .single();
        
        if (newRound) {
          setTimeout(() => {
            dealCards(supabaseClient, newRound.id, jokerCard, deck.slice(1), settings);
          }, bettingDuration * 1000);
        }
      } else if (activeRound.status === 'betting' && new Date(activeRound.bet_end_time) <= new Date()) {
        // Start dealing if betting time has ended
        const deck = shuffleDeck(createDeck());
        const { data: gameSettings } = await supabaseClient
          .from('game_settings')
          .select('settings')
          .eq('game_type', 'andar_bahar')
          .single();
        
        const settings = gameSettings?.settings || {};
        dealCards(supabaseClient, activeRound.id, activeRound.joker_card, deck, settings);
      }

      return new Response(JSON.stringify({ success: true, managed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Function to deal cards and determine winner
async function dealCards(supabaseClient: any, roundId: string, jokerCard: Card, deck: Card[], settings: any) {
  try {
    // Update round status to dealing
    await supabaseClient
      .from('andar_bahar_rounds')
      .update({ status: 'dealing' })
      .eq('id', roundId);

    const andarCards: Card[] = [];
    const baharCards: Card[] = [];
    let winningSide: 'andar' | 'bahar' | null = null;
    let winningCard: Card | null = null;
    let deckIndex = 0;

    // Check for cheat mode
    const cheatMode = settings.cheat_mode || false;
    const forcedWinner = settings.forced_winner; // 'andar' or 'bahar'

    if (cheatMode && forcedWinner) {
      // In cheat mode, we control the outcome
      while (!winningSide && deckIndex < deck.length) {
        const card = deck[deckIndex++];
        const isAndarTurn = (andarCards.length + baharCards.length) % 2 === 0;
        
        if (card.rank === jokerCard.rank) {
          // This is a matching card
          if (forcedWinner === 'andar' && isAndarTurn) {
            andarCards.push(card);
            winningSide = 'andar';
            winningCard = card;
          } else if (forcedWinner === 'bahar' && !isAndarTurn) {
            baharCards.push(card);
            winningSide = 'bahar';
            winningCard = card;
          } else {
            // Skip this card and place a non-matching card instead
            let nonMatchingCard;
            do {
              nonMatchingCard = deck[deckIndex++];
            } while (nonMatchingCard && nonMatchingCard.rank === jokerCard.rank && deckIndex < deck.length);
            
            if (nonMatchingCard) {
              if (isAndarTurn) {
                andarCards.push(nonMatchingCard);
              } else {
                baharCards.push(nonMatchingCard);
              }
            }
          }
        } else {
          // Non-matching card, place normally
          if (isAndarTurn) {
            andarCards.push(card);
          } else {
            baharCards.push(card);
          }
        }
        
        // Add a small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // If we haven't found a winner yet, place the matching card on the forced side
      if (!winningSide && deckIndex < deck.length) {
        const matchingCard = deck.find(card => card.rank === jokerCard.rank) || deck[deckIndex];
        if (forcedWinner === 'andar') {
          andarCards.push(matchingCard);
          winningSide = 'andar';
        } else {
          baharCards.push(matchingCard);
          winningSide = 'bahar';
        }
        winningCard = matchingCard;
      }
    } else {
      // Normal gameplay
      while (!winningSide && deckIndex < deck.length) {
        const card = deck[deckIndex++];
        const isAndarTurn = (andarCards.length + baharCards.length) % 2 === 0;
        
        if (isAndarTurn) {
          andarCards.push(card);
          if (card.rank === jokerCard.rank) {
            winningSide = 'andar';
            winningCard = card;
          }
        } else {
          baharCards.push(card);
          if (card.rank === jokerCard.rank) {
            winningSide = 'bahar';
            winningCard = card;
          }
        }
        
        // Add a small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update round with results
    await supabaseClient
      .from('andar_bahar_rounds')
      .update({
        andar_cards: andarCards,
        bahar_cards: baharCards,
        winning_side: winningSide,
        winning_card: winningCard,
        status: 'completed',
        game_end_time: new Date().toISOString()
      })
      .eq('id', roundId);

    // Process bets and payouts
    if (winningSide) {
      await supabaseClient.rpc('process_andar_bahar_round', {
        p_round_id: roundId,
        p_winning_side: winningSide,
        p_winning_card: winningCard
      });
    }

  } catch (error) {
    console.error('Error dealing cards:', error);
  }
}