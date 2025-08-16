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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method } = req;
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (method === 'POST') {
      const body = await req.json();
      
      switch (action) {
        case 'create-table': {
          const { tableName, entryFee, minPlayers, maxPlayers, minBet, maxBet } = body;
          const authHeader = req.headers.get('authorization');
          
          if (!authHeader) {
            throw new Error('Authorization required');
          }

          const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
          if (authError || !user) {
            throw new Error('Invalid authentication');
          }

          const { data: table, error } = await supabaseClient
            .from('teen_patti_tables')
            .insert({
              table_name: tableName,
              entry_fee: entryFee,
              min_players: minPlayers,
              max_players: maxPlayers,
              min_bet: minBet,
              max_bet: maxBet,
              created_by: user.id
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({ success: true, table }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'join-table': {
          const { tableId } = body;
          const authHeader = req.headers.get('authorization');
          
          if (!authHeader) {
            throw new Error('Authorization required');
          }

          const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
          if (authError || !user) {
            throw new Error('Invalid authentication');
          }

          // Get table info
          const { data: table, error: tableError } = await supabaseClient
            .from('teen_patti_tables')
            .select('*')
            .eq('id', tableId)
            .single();

          if (tableError || !table) {
            throw new Error('Table not found');
          }

          if (table.current_players >= table.max_players) {
            throw new Error('Table is full');
          }

          // Check user wallet balance
          const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('current_balance')
            .eq('user_id', user.id)
            .single();

          if (walletError || !wallet || wallet.current_balance < table.entry_fee) {
            throw new Error('Insufficient balance');
          }

          // Check if game exists for this table
          let { data: game, error: gameError } = await supabaseClient
            .from('teen_patti_games')
            .select('*')
            .eq('table_id', tableId)
            .eq('game_state', 'waiting')
            .single();

          // Create new game if none exists
          if (!game) {
            const { data: newGame, error: createGameError } = await supabaseClient
              .from('teen_patti_games')
              .insert({
                table_id: tableId,
                boot_amount: table.min_bet,
                game_state: 'waiting'
              })
              .select()
              .single();

            if (createGameError) throw createGameError;
            game = newGame;
          }

          // Check if user already joined
          const { data: existingPlayer } = await supabaseClient
            .from('teen_patti_players')
            .select('*')
            .eq('game_id', game.id)
            .eq('user_id', user.id)
            .single();

          if (existingPlayer) {
            return new Response(JSON.stringify({ success: true, gameId: game.id, message: 'Already joined' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Find available seat
          const { data: players, error: playersError } = await supabaseClient
            .from('teen_patti_players')
            .select('seat_number')
            .eq('game_id', game.id);

          if (playersError) throw playersError;

          const occupiedSeats = players?.map(p => p.seat_number) || [];
          let seatNumber = 1;
          while (occupiedSeats.includes(seatNumber) && seatNumber <= table.max_players) {
            seatNumber++;
          }

          if (seatNumber > table.max_players) {
            throw new Error('No available seats');
          }

          // Deduct entry fee from wallet
          const { error: walletUpdateError } = await supabaseClient
            .from('wallets')
            .update({ current_balance: wallet.current_balance - table.entry_fee })
            .eq('user_id', user.id);

          if (walletUpdateError) throw walletUpdateError;

          // Add wallet transaction
          const { error: transactionError } = await supabaseClient
            .from('wallet_transactions')
            .insert({
              user_id: user.id,
              amount: table.entry_fee,
              type: 'debit',
              reason: `Teen Patti table entry fee - ${table.table_name}`,
              balance_after: wallet.current_balance - table.entry_fee,
              game_type: 'casino',
              game_session_id: game.id
            });

          if (transactionError) throw transactionError;

          // Add player to game
          const { data: player, error: playerError } = await supabaseClient
            .from('teen_patti_players')
            .insert({
              game_id: game.id,
              user_id: user.id,
              seat_number: seatNumber,
              chips_in_game: table.entry_fee
            })
            .select()
            .single();

          if (playerError) throw playerError;

          // Update table player count
          const { error: tableUpdateError } = await supabaseClient
            .from('teen_patti_tables')
            .update({ current_players: table.current_players + 1 })
            .eq('id', tableId);

          if (tableUpdateError) throw tableUpdateError;

          // Update game player count
          const { error: gameUpdateError } = await supabaseClient
            .from('teen_patti_games')
            .update({ total_players: (game.total_players || 0) + 1 })
            .eq('id', game.id);

          if (gameUpdateError) throw gameUpdateError;

          // Check if we can start the game
          const newPlayerCount = (game.total_players || 0) + 1;
          if (newPlayerCount >= table.min_players) {
            await startGame(supabaseClient, game.id);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            gameId: game.id, 
            playerId: player.id,
            seatNumber: seatNumber,
            message: 'Joined table successfully' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'place-bet': {
          const { gameId, betType, betAmount } = body;
          const authHeader = req.headers.get('authorization');
          
          if (!authHeader) {
            throw new Error('Authorization required');
          }

          const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
          if (authError || !user) {
            throw new Error('Invalid authentication');
          }

          // Get game and player info
          const { data: game, error: gameError } = await supabaseClient
            .from('teen_patti_games')
            .select('*')
            .eq('id', gameId)
            .single();

          if (gameError || !game) {
            throw new Error('Game not found');
          }

          const { data: player, error: playerError } = await supabaseClient
            .from('teen_patti_players')
            .select('*')
            .eq('game_id', gameId)
            .eq('user_id', user.id)
            .single();

          if (playerError || !player) {
            throw new Error('Player not found in game');
          }

          if (game.game_state !== 'betting') {
            throw new Error('Game is not in betting state');
          }

          if (game.current_player_turn !== user.id) {
            throw new Error('Not your turn');
          }

          if (player.is_folded) {
            throw new Error('Player has folded');
          }

          // Validate bet amount
          const currentBet = game.current_bet || 0;
          
          if (betType === 'chaal' && betAmount < currentBet) {
            throw new Error('Bet amount must be at least equal to current bet');
          }

          if (betType === 'blind' && player.is_seen) {
            throw new Error('Cannot place blind bet after seeing cards');
          }

          // Get wallet balance
          const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('current_balance')
            .eq('user_id', user.id)
            .single();

          if (walletError || !wallet || wallet.current_balance < betAmount) {
            throw new Error('Insufficient balance');
          }

          // Process bet
          let newGameState = game.game_state;
          let nextPlayer = getNextPlayer(supabaseClient, gameId, user.id);

          if (betType === 'pack') {
            // Fold player
            await supabaseClient
              .from('teen_patti_players')
              .update({ 
                is_folded: true, 
                status: 'folded',
                last_action: 'pack',
                last_action_time: new Date().toISOString()
              })
              .eq('id', player.id);
          } else {
            // Deduct from wallet
            await supabaseClient
              .from('wallets')
              .update({ current_balance: wallet.current_balance - betAmount })
              .eq('user_id', user.id);

            // Add wallet transaction
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

            // Update player bet
            await supabaseClient
              .from('teen_patti_players')
              .update({ 
                current_bet: betAmount,
                total_bet_this_round: player.total_bet_this_round + betAmount,
                is_seen: betType === 'chaal' ? true : player.is_seen,
                last_action: betType,
                last_action_time: new Date().toISOString()
              })
              .eq('id', player.id);

            // Add bet record
            await supabaseClient
              .from('teen_patti_bets')
              .insert({
                game_id: gameId,
                player_id: player.id,
                user_id: user.id,
                bet_type: betType,
                bet_amount: betAmount,
                pot_amount_before: game.current_pot,
                pot_amount_after: game.current_pot + betAmount
              });

            // Update game pot and current bet
            await supabaseClient
              .from('teen_patti_games')
              .update({ 
                current_pot: game.current_pot + betAmount,
                current_bet: Math.max(currentBet, betAmount)
              })
              .eq('id', gameId);
          }

          // Check if game should end
          const { data: activePlayers } = await supabaseClient
            .from('teen_patti_players')
            .select('*')
            .eq('game_id', gameId)
            .eq('is_folded', false);

          if (activePlayers && activePlayers.length <= 1) {
            // End game - last player wins
            await endGame(supabaseClient, gameId, activePlayers[0]?.user_id);
            newGameState = 'finished';
          } else if (betType === 'show' && activePlayers && activePlayers.length === 2) {
            // Showdown between two players
            await showdown(supabaseClient, gameId);
            newGameState = 'finished';
          } else {
            // Move to next player
            const nextPlayerId = await getNextActivePlayer(supabaseClient, gameId, user.id);
            await supabaseClient
              .from('teen_patti_games')
              .update({ 
                current_player_turn: nextPlayerId,
                game_state: newGameState
              })
              .eq('id', gameId);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            message: `${betType} placed successfully`,
            gameState: newGameState
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        default:
          throw new Error('Unknown action');
      }
    }

    if (method === 'GET') {
      switch (action) {
        case 'tables': {
          const { data: tables, error } = await supabaseClient
            .from('teen_patti_tables')
            .select('*')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(JSON.stringify({ success: true, tables }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'game-state': {
          const gameId = url.searchParams.get('gameId');
          if (!gameId) throw new Error('Game ID required');

          const { data: game, error: gameError } = await supabaseClient
            .from('teen_patti_games')
            .select('*')
            .eq('id', gameId)
            .single();

          if (gameError) throw gameError;

          const { data: players, error: playersError } = await supabaseClient
            .from('teen_patti_players')
            .select(`
              *,
              profiles!inner(full_name)
            `)
            .eq('game_id', gameId)
            .order('seat_number');

          if (playersError) throw playersError;

          return new Response(JSON.stringify({ 
            success: true, 
            game,
            players: players?.map(p => ({
              ...p,
              cards: p.user_id === p.user_id ? p.cards : null // Hide cards from other players
            }))
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        default:
          throw new Error('Unknown action');
      }
    }

    throw new Error('Method not allowed');

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

async function startGame(supabaseClient: any, gameId: string) {
  console.log(`Starting game ${gameId}`);
  
  // Deal cards to all players
  const { data: players, error: playersError } = await supabaseClient
    .from('teen_patti_players')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'active');

  if (playersError || !players) throw playersError;

  const deck = createDeck();
  let cardIndex = 0;

  for (const player of players) {
    const playerCards = [
      deck[cardIndex++],
      deck[cardIndex++],
      deck[cardIndex++]
    ];

    await supabaseClient
      .from('teen_patti_players')
      .update({ cards: playerCards })
      .eq('id', player.id);
  }

  // Set first player as current turn
  const firstPlayer = players[0];
  
  await supabaseClient
    .from('teen_patti_games')
    .update({ 
      game_state: 'betting',
      current_player_turn: firstPlayer.user_id,
      started_at: new Date().toISOString()
    })
    .eq('id', gameId);
}

async function getNextActivePlayer(supabaseClient: any, gameId: string, currentUserId: string): Promise<string | null> {
  const { data: players, error } = await supabaseClient
    .from('teen_patti_players')
    .select('user_id, seat_number')
    .eq('game_id', gameId)
    .eq('is_folded', false)
    .eq('status', 'active')
    .order('seat_number');

  if (error || !players) return null;

  const currentPlayerIndex = players.findIndex(p => p.user_id === currentUserId);
  const nextIndex = (currentPlayerIndex + 1) % players.length;
  
  return players[nextIndex]?.user_id || null;
}

async function endGame(supabaseClient: any, gameId: string, winnerId: string) {
  const { data: game, error: gameError } = await supabaseClient
    .from('teen_patti_games')
    .select('current_pot')
    .eq('id', gameId)
    .single();

  if (gameError || !game) return;

  // Credit winner with pot
  const { data: wallet, error: walletError } = await supabaseClient
    .from('wallets')
    .select('current_balance')
    .eq('user_id', winnerId)
    .single();

  if (!walletError && wallet) {
    await supabaseClient
      .from('wallets')
      .update({ current_balance: wallet.current_balance + game.current_pot })
      .eq('user_id', winnerId);

    await supabaseClient
      .from('wallet_transactions')
      .insert({
        user_id: winnerId,
        amount: game.current_pot,
        type: 'credit',
        reason: 'Teen Patti game win',
        balance_after: wallet.current_balance + game.current_pot,
        game_type: 'casino',
        game_session_id: gameId
      });
  }

  // Update game as finished
  await supabaseClient
    .from('teen_patti_games')
    .update({ 
      game_state: 'finished',
      winner_id: winnerId,
      completed_at: new Date().toISOString()
    })
    .eq('id', gameId);
}

async function showdown(supabaseClient: any, gameId: string) {
  const { data: players, error } = await supabaseClient
    .from('teen_patti_players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_folded', false);

  if (error || !players || players.length !== 2) return;

  // Evaluate hands
  const player1 = players[0];
  const player2 = players[1];
  
  const hand1 = evaluateHand(player1.cards);
  const hand2 = evaluateHand(player2.cards);

  const winnerId = hand1.strength > hand2.strength ? player1.user_id : player2.user_id;
  
  // Store results
  for (const player of players) {
    const hand = player.user_id === player1.user_id ? hand1 : hand2;
    const isWinner = player.user_id === winnerId;
    
    await supabaseClient
      .from('teen_patti_results')
      .insert({
        game_id: gameId,
        user_id: player.user_id,
        final_hand: player.cards,
        hand_rank: hand.rank,
        hand_strength: hand.strength,
        tokens_won: isWinner ? 0 : 0, // Will be updated in endGame
        tokens_lost: player.total_bet_this_round,
        final_position: isWinner ? 1 : 2,
        is_winner: isWinner
      });
  }

  await endGame(supabaseClient, gameId, winnerId);
}