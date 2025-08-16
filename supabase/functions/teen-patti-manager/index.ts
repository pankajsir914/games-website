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
  COLOR: 3,
  SEQUENCE: 4,
  PURE_SEQUENCE: 5,
  TRAIL: 6
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

function evaluateHand(cards: Card[]): { rank: string; strength: number; cards: Card[] } {
  if (cards.length !== 3) throw new Error('Invalid hand size');

  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  const ranks = sortedCards.map(c => c.value);
  const suits = sortedCards.map(c => c.suit);
  
  // Check for Trail (Three of a Kind)
  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
    return {
      rank: 'TRAIL',
      strength: HAND_RANKINGS.TRAIL * 1000 + ranks[0],
      cards: sortedCards
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
      cards: sortedCards
    };
  }

  // Check for Sequence (Straight)
  if (isSequence) {
    return {
      rank: 'SEQUENCE',
      strength: HAND_RANKINGS.SEQUENCE * 1000 + ranks[0],
      cards: sortedCards
    };
  }

  // Check for Color (Flush)
  if (isFlush) {
    return {
      rank: 'COLOR',
      strength: HAND_RANKINGS.COLOR * 1000 + ranks[0] * 100 + ranks[1] * 10 + ranks[2],
      cards: sortedCards
    };
  }

  // Check for Pair
  if (ranks[0] === ranks[1] || ranks[1] === ranks[2] || ranks[0] === ranks[2]) {
    const pairValue = ranks[0] === ranks[1] ? ranks[0] : ranks[1] === ranks[2] ? ranks[1] : ranks[2];
    const kicker = ranks.find(r => r !== pairValue) || 0;
    return {
      rank: 'PAIR',
      strength: HAND_RANKINGS.PAIR * 1000 + pairValue * 10 + kicker,
      cards: sortedCards
    };
  }

  // High Card
  return {
    rank: 'HIGH_CARD',
    strength: HAND_RANKINGS.HIGH_CARD * 1000 + ranks[0] * 100 + ranks[1] * 10 + ranks[2],
    cards: sortedCards
  };
}

function getSystemAction(systemCards: Card[], playerBet: number, currentPot: number, difficulty: string): { action: string; amount: number } {
  const hand = evaluateHand(systemCards);
  const handStrength = hand.strength;
  
  // Difficulty affects decision making
  let aggressiveness = 0.5; // Default medium
  if (difficulty === 'Easy') aggressiveness = 0.3;
  if (difficulty === 'Hard') aggressiveness = 0.7;
  
  const random = Math.random();
  
  // Very strong hands (Trail, Pure Sequence)
  if (handStrength >= HAND_RANKINGS.PURE_SEQUENCE * 1000) {
    if (random < 0.8 + aggressiveness * 0.2) {
      return { action: 'raise', amount: Math.max(playerBet * 1.5, playerBet + 20) };
    }
    return { action: 'call', amount: playerBet };
  }
  
  // Strong hands (Sequence, Color)
  if (handStrength >= HAND_RANKINGS.SEQUENCE * 1000) {
    if (random < 0.6 + aggressiveness * 0.3) {
      return { action: 'call', amount: playerBet };
    }
    if (random < 0.8) {
      return { action: 'raise', amount: playerBet + 10 };
    }
    return { action: 'fold', amount: 0 };
  }
  
  // Medium hands (Pair)
  if (handStrength >= HAND_RANKINGS.PAIR * 1000) {
    if (playerBet <= currentPot * 0.3) {
      return { action: 'call', amount: playerBet };
    }
    if (random < 0.4 + aggressiveness * 0.2) {
      return { action: 'call', amount: playerBet };
    }
    return { action: 'fold', amount: 0 };
  }
  
  // Weak hands (High Card)
  if (playerBet <= currentPot * 0.2) {
    if (random < 0.5 - aggressiveness * 0.3) {
      return { action: 'call', amount: playerBet };
    }
  }
  
  return { action: 'fold', amount: 0 };
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
    console.log('Teen Patti Manager Request:', body);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { action } = body;

    switch (action) {
      case 'start-game': {
        const { gameMode, entryFee, minBet, maxBet, difficulty } = body;

        // Check user wallet balance
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();

        if (walletError || !wallet || wallet.current_balance < entryFee) {
          throw new Error('Insufficient balance');
        }

        // Deduct entry fee
        const { error: walletUpdateError } = await supabaseClient
          .from('wallets')
          .update({ current_balance: wallet.current_balance - entryFee })
          .eq('user_id', user.id);

        if (walletUpdateError) throw walletUpdateError;

        // Add wallet transaction
        const { error: transactionError } = await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount: entryFee,
            type: 'debit',
            reason: `Teen Patti entry fee - ${gameMode}`,
            balance_after: wallet.current_balance - entryFee,
            game_type: 'casino'
          });

        if (transactionError) throw transactionError;

        // Create game session
        const { data: game, error: gameError } = await supabaseClient
          .from('game_sessions')
          .insert({
            game_type: 'teen_patti',
            entry_fee: entryFee,
            max_players: 2,
            current_players: 2,
            created_by: user.id,
            players: {
              user_ids: [user.id, 'system'],
              user_data: {
                [user.id]: { name: 'Player', chips: entryFee },
                'system': { name: 'System', chips: entryFee }
              }
            },
            status: 'active'
          })
          .select()
          .single();

        if (gameError) throw gameError;

        // Deal cards
        const deck = createDeck();
        const playerCards = [deck[0], deck[1], deck[2]];
        const systemCards = [deck[3], deck[4], deck[5]];

        // Store game state
        const gameState = {
          playerCards,
          systemCards,
          currentPot: entryFee * 2,
          currentBet: minBet,
          minBet,
          maxBet,
          difficulty,
          phase: 'betting',
          playerTurn: true,
          playerChips: entryFee,
          systemChips: entryFee,
          gameMode
        };

        const { error: updateError } = await supabaseClient
          .from('game_sessions')
          .update({
            result: gameState,
            started_at: new Date().toISOString()
          })
          .eq('id', game.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ 
          success: true, 
          gameId: game.id,
          message: 'Game started successfully!'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-game-state': {
        const { gameId } = body;

        const { data: game, error: gameError } = await supabaseClient
          .from('game_sessions')
          .select('*')
          .eq('id', gameId)
          .eq('created_by', user.id)
          .single();

        if (gameError || !game) {
          throw new Error('Game not found');
        }

        return new Response(JSON.stringify({ 
          success: true, 
          game: game.result,
          status: game.status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'place-bet': {
        const { gameId, betType, betAmount } = body;

        const { data: game, error: gameError } = await supabaseClient
          .from('game_sessions')
          .select('*')
          .eq('id', gameId)
          .eq('created_by', user.id)
          .single();

        if (gameError || !game) {
          throw new Error('Game not found');
        }

        const gameState = game.result;
        
        if (!gameState.playerTurn) {
          throw new Error('Not your turn');
        }

        if (gameState.phase !== 'betting') {
          throw new Error('Game is not in betting phase');
        }

        // Check wallet balance for bet amount
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();

        if (walletError || !wallet || wallet.current_balance < betAmount) {
          throw new Error('Insufficient balance');
        }

        let newGameState = { ...gameState };
        let gameEnded = false;
        let winner = null;

        if (betType === 'fold') {
          // Player folds - System wins
          winner = 'system';
          gameEnded = true;
          newGameState.phase = 'finished';
          newGameState.winner = 'system';
        } else {
          // Player bets - deduct from wallet
          await supabaseClient
            .from('wallets')
            .update({ current_balance: wallet.current_balance - betAmount })
            .eq('user_id', user.id);

          await supabaseClient
            .from('wallet_transactions')
            .insert({
              user_id: user.id,
              amount: betAmount,
              type: 'debit',
              reason: `Teen Patti ${betType} bet`,
              balance_after: wallet.current_balance - betAmount,
              game_type: 'casino',
              game_session_id: gameId
            });

          newGameState.currentPot += betAmount;
          newGameState.playerChips -= betAmount;
          newGameState.currentBet = betAmount;

          // System's turn
          newGameState.playerTurn = false;
          
          // Get system action
          const systemAction = getSystemAction(
            newGameState.systemCards, 
            betAmount, 
            newGameState.currentPot,
            newGameState.difficulty
          );

          if (systemAction.action === 'fold') {
            // System folds - Player wins
            winner = 'player';
            gameEnded = true;
            newGameState.phase = 'finished';
            newGameState.winner = 'player';
          } else if (systemAction.action === 'call' || systemAction.action === 'raise') {
            newGameState.currentPot += systemAction.amount;
            newGameState.systemChips -= systemAction.amount;
            
            if (betType === 'show' || systemAction.action === 'call') {
              // Showdown
              const playerHand = evaluateHand(newGameState.playerCards);
              const systemHand = evaluateHand(newGameState.systemCards);
              
              if (playerHand.strength > systemHand.strength) {
                winner = 'player';
              } else if (systemHand.strength > playerHand.strength) {
                winner = 'system';
              } else {
                winner = 'tie';
              }
              
              gameEnded = true;
              newGameState.phase = 'finished';
              newGameState.winner = winner;
              newGameState.playerHandRank = playerHand.rank;
              newGameState.systemHandRank = systemHand.rank;
            }
          }
        }

        // Handle game end
        if (gameEnded) {
          let winAmount = 0;
          
          if (winner === 'player') {
            winAmount = newGameState.currentPot;
            
            // Credit player wallet
            await supabaseClient
              .from('wallets')
              .update({ current_balance: wallet.current_balance - betAmount + winAmount })
              .eq('user_id', user.id);

            await supabaseClient
              .from('wallet_transactions')
              .insert({
                user_id: user.id,
                amount: winAmount,
                type: 'credit',
                reason: 'Teen Patti win',
                balance_after: wallet.current_balance - betAmount + winAmount,
                game_type: 'casino',
                game_session_id: gameId
              });
          } else if (winner === 'tie') {
            // Return player's total bet
            const playerTotalBet = game.entry_fee + betAmount;
            
            await supabaseClient
              .from('wallets')
              .update({ current_balance: wallet.current_balance - betAmount + playerTotalBet })
              .eq('user_id', user.id);

            await supabaseClient
              .from('wallet_transactions')
              .insert({
                user_id: user.id,
                amount: playerTotalBet,
                type: 'credit',
                reason: 'Teen Patti tie - refund',
                balance_after: wallet.current_balance - betAmount + playerTotalBet,
                game_type: 'casino',
                game_session_id: gameId
              });
          }

          // Update game session
          await supabaseClient
            .from('game_sessions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result: newGameState
            })
            .eq('id', gameId);
        } else {
          // Update game state
          await supabaseClient
            .from('game_sessions')
            .update({ result: newGameState })
            .eq('id', gameId);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          gameState: newGameState,
          message: gameEnded ? `Game finished! ${winner === 'player' ? 'You won!' : winner === 'system' ? 'System won!' : 'It\'s a tie!'}` : 'Bet placed successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Teen Patti Manager Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});