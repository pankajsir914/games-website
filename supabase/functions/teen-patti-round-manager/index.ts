import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

// Teen Patti hand rankings (higher number = better hand)
const HAND_RANKINGS = {
  HIGH_CARD: 1,
  PAIR: 2,
  COLOR: 3,        // Flush
  SEQUENCE: 4,     // Straight
  PURE_SEQUENCE: 5, // Straight Flush
  TRAIL: 6         // Three of a Kind
};

function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      let value = parseInt(rank);
      if (rank === 'A') value = 14; // Ace high
      if (rank === 'J') value = 11;
      if (rank === 'Q') value = 12;
      if (rank === 'K') value = 13;
      
      deck.push({ suit, rank, value });
    }
  }

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function evaluateHand(cards: Card[]): { rank: string; strength: number; handName: string } {
  if (cards.length !== 3) throw new Error('Invalid hand size');

  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  const ranks = sortedCards.map(c => c.value);
  const suits = sortedCards.map(c => c.suit);
  
  // Check for Trail (Three of a Kind)
  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
    return {
      rank: 'TRAIL',
      strength: HAND_RANKINGS.TRAIL * 1000 + ranks[0],
      handName: 'Trail'
    };
  }

  // Check for Pure Sequence (Straight Flush)
  const isSequence = (ranks[0] === ranks[1] + 1 && ranks[1] === ranks[2] + 1) ||
                    (ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2); // A-3-2
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];

  if (isSequence && isFlush) {
    return {
      rank: 'PURE_SEQUENCE',
      strength: HAND_RANKINGS.PURE_SEQUENCE * 1000 + ranks[0],
      handName: 'Pure Sequence'
    };
  }

  // Check for Sequence (Straight)
  if (isSequence) {
    return {
      rank: 'SEQUENCE',
      strength: HAND_RANKINGS.SEQUENCE * 1000 + ranks[0],
      handName: 'Sequence'
    };
  }

  // Check for Color (Flush)
  if (isFlush) {
    return {
      rank: 'COLOR',
      strength: HAND_RANKINGS.COLOR * 1000 + ranks[0] * 100 + ranks[1] * 10 + ranks[2],
      handName: 'Color'
    };
  }

  // Check for Pair
  if (ranks[0] === ranks[1] || ranks[1] === ranks[2] || ranks[0] === ranks[2]) {
    const pairValue = ranks[0] === ranks[1] ? ranks[0] : ranks[1] === ranks[2] ? ranks[1] : ranks[2];
    const kicker = ranks.find(r => r !== pairValue) || 0;
    return {
      rank: 'PAIR',
      strength: HAND_RANKINGS.PAIR * 1000 + pairValue * 10 + kicker,
      handName: 'Pair'
    };
  }

  // High Card
  return {
    rank: 'HIGH_CARD',
    strength: HAND_RANKINGS.HIGH_CARD * 1000 + ranks[0] * 100 + ranks[1] * 10 + ranks[2],
    handName: 'High Card'
  };
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

    const body = await req.json();
    console.log('Teen Patti Round Manager Request:', body);

    const authHeader = req.headers.get('authorization');
    if (!authHeader && body.action !== 'get-current-round') {
      throw new Error('Authorization required');
    }

    let user = null;
    if (authHeader) {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !authUser) {
        throw new Error('Invalid authentication');
      }
      user = authUser;
    }

    const { action } = body;

    switch (action) {
      case 'get-current-round': {
        // Get current active round or create new one
        const { data: currentRound, error } = await supabaseClient
          .from('teen_patti_rounds')
          .select('*')
          .eq('status', 'betting')
          .gte('bet_end_time', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!currentRound) {
          // Create new round (60 second timer)
          const roundNumber = await getNextRoundNumber(supabaseClient);
          const betEndTime = new Date(Date.now() + 60000).toISOString(); // 60 seconds from now

          const { data: newRound, error: createError } = await supabaseClient
            .from('teen_patti_rounds')
            .insert({
              round_number: roundNumber,
              bet_end_time: betEndTime,
              status: 'betting'
            })
            .select()
            .single();

          if (createError) throw createError;

          return new Response(JSON.stringify({
            success: true,
            round: newRound,
            timeRemaining: 60
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const timeRemaining = Math.max(0, Math.floor((new Date(currentRound.bet_end_time).getTime() - Date.now()) / 1000));
        
        return new Response(JSON.stringify({
          success: true,
          round: currentRound,
          timeRemaining
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'place-bet': {
        if (!user) throw new Error('Authentication required');
        
        const { roundId, betAmount } = body;

        if (betAmount < 10 || betAmount > 10000) {
          throw new Error('Bet amount must be between ₹10 and ₹10,000');
        }

        // Check if round is still accepting bets
        const { data: round, error: roundError } = await supabaseClient
          .from('teen_patti_rounds')
          .select('*')
          .eq('id', roundId)
          .eq('status', 'betting')
          .gte('bet_end_time', new Date().toISOString())
          .single();

        if (roundError || !round) {
          throw new Error('Round not found or betting period ended');
        }

        // Check if user already placed bet in this round
        const { data: existingBet } = await supabaseClient
          .from('teen_patti_bets')
          .select('id')
          .eq('round_id', roundId)
          .eq('user_id', user.id)
          .single();

        if (existingBet) {
          throw new Error('You have already placed a bet in this round');
        }

        // Check wallet balance
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();

        if (walletError || !wallet || wallet.current_balance < betAmount) {
          throw new Error('Insufficient balance');
        }

        // Deduct bet amount
        const { error: updateWalletError } = await supabaseClient
          .from('wallets')
          .update({ current_balance: wallet.current_balance - betAmount })
          .eq('user_id', user.id);

        if (updateWalletError) throw updateWalletError;

        // Record wallet transaction
        const { error: transactionError } = await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount: betAmount,
            type: 'debit',
            reason: `Teen Patti bet - Round ${round.round_number}`,
            balance_after: wallet.current_balance - betAmount,
            game_type: 'casino'
          });

        if (transactionError) throw transactionError;

        // Place bet
        const { data: bet, error: betError } = await supabaseClient
          .from('teen_patti_bets')
          .insert({
            user_id: user.id,
            round_id: roundId,
            bet_amount: betAmount
          })
          .select()
          .single();

        if (betError) throw betError;

        // Update round totals
        const { error: updateRoundError } = await supabaseClient
          .from('teen_patti_rounds')
          .update({
            total_pot: round.total_pot + betAmount,
            total_players: round.total_players + 1
          })
          .eq('id', roundId);

        if (updateRoundError) throw updateRoundError;

        return new Response(JSON.stringify({
          success: true,
          message: 'Bet placed successfully',
          betId: bet.id,
          newBalance: wallet.current_balance - betAmount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'complete-round': {
        const { roundId } = body;

        // Get round details
        const { data: round, error: roundError } = await supabaseClient
          .from('teen_patti_rounds')
          .select('*')
          .eq('id', roundId)
          .eq('status', 'betting')
          .single();

        if (roundError || !round) {
          throw new Error('Round not found or already completed');
        }

        // Update round status to processing
        await supabaseClient
          .from('teen_patti_rounds')
          .update({ status: 'processing' })
          .eq('id', roundId);

        // Generate random cards and determine winner
        const deck = createDeck();
        const drawnCards = [deck[0], deck[1], deck[2]];
        const handEvaluation = evaluateHand(drawnCards);

        // Calculate payout multiplier based on hand strength
        let multiplier = 1.0;
        switch (handEvaluation.rank) {
          case 'TRAIL': multiplier = 50.0; break;
          case 'PURE_SEQUENCE': multiplier = 40.0; break;
          case 'SEQUENCE': multiplier = 30.0; break;
          case 'COLOR': multiplier = 20.0; break;
          case 'PAIR': multiplier = 10.0; break;
          case 'HIGH_CARD': multiplier = 2.0; break;
        }

        // Get all bets for this round
        const { data: bets, error: betsError } = await supabaseClient
          .from('teen_patti_bets')
          .select('*')
          .eq('round_id', roundId)
          .eq('status', 'pending');

        if (betsError) throw betsError;

        let totalPayouts = 0;
        const winners = [];

        // Process payouts
        for (const bet of bets || []) {
          const payoutAmount = bet.bet_amount * multiplier;
          totalPayouts += payoutAmount;

          // Update bet with payout
          await supabaseClient
            .from('teen_patti_bets')
            .update({
              status: 'won',
              payout_amount: payoutAmount,
              multiplier: multiplier
            })
            .eq('id', bet.id);

          // Credit user wallet
          const { data: userWallet } = await supabaseClient
            .from('wallets')
            .select('current_balance')
            .eq('user_id', bet.user_id)
            .single();

          if (userWallet) {
            await supabaseClient
              .from('wallets')
              .update({ current_balance: userWallet.current_balance + payoutAmount })
              .eq('user_id', bet.user_id);

            // Record transaction
            await supabaseClient
              .from('wallet_transactions')
              .insert({
                user_id: bet.user_id,
                amount: payoutAmount,
                type: 'credit',
                reason: `Teen Patti win - Round ${round.round_number} (${handEvaluation.handName})`,
                balance_after: userWallet.current_balance + payoutAmount,
                game_type: 'casino'
              });

            winners.push(bet.user_id);
          }
        }

        // Store round result
        await supabaseClient
          .from('teen_patti_results')
          .insert({
            round_id: roundId,
            player_cards: drawnCards,
            winning_hand: handEvaluation.handName,
            winning_cards: drawnCards,
            hand_strength: handEvaluation.strength,
            total_bets: round.total_pot,
            total_winners: winners.length
          });

        // Update round as completed
        await supabaseClient
          .from('teen_patti_rounds')
          .update({
            status: 'completed',
            result_time: new Date().toISOString(),
            winning_cards: drawnCards,
            winning_hand_rank: handEvaluation.handName
          })
          .eq('id', roundId);

        return new Response(JSON.stringify({
          success: true,
          result: {
            winningCards: drawnCards,
            handRank: handEvaluation.handName,
            multiplier: multiplier,
            totalWinners: winners.length,
            totalPayouts: totalPayouts
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-round-history': {
        const { data: history, error } = await supabaseClient
          .from('teen_patti_rounds')
          .select('*, teen_patti_results(*)')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          history: history || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-user-bets': {
        if (!user) throw new Error('Authentication required');

        const { data: userBets, error } = await supabaseClient
          .from('teen_patti_bets')
          .select('*, teen_patti_rounds(round_number, status, winning_hand_rank)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          bets: userBets || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Teen Patti Round Manager Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getNextRoundNumber(supabaseClient: any): Promise<number> {
  const { data } = await supabaseClient
    .from('teen_patti_rounds')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1)
    .single();
  
  return (data?.round_number || 0) + 1;
}