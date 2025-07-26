import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Card {
  suit: string;
  rank: number;
  name: string;
}

interface PokerPlayer {
  id: string;
  user_id: string;
  seat_number: number;
  chip_count: number;
  hole_cards?: Card[];
  current_bet: number;
  total_bet_this_hand: number;
  status: string;
  is_all_in: boolean;
  has_acted_this_round: boolean;
  last_action?: string;
}

interface PokerGame {
  id: string;
  table_id: string;
  game_state: string;
  community_cards: Card[];
  pot_amount: number;
  current_bet: number;
  current_player_turn?: string;
  dealer_position: number;
  betting_round: number;
  minimum_bet: number;
  players_in_hand: string[];
}

class PokerGameManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }

  // Generate a standard 52-card deck
  generateDeck(): Card[] {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 11=J, 12=Q, 13=K, 14=A
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        let name = rank.toString();
        if (rank === 11) name = 'J';
        else if (rank === 12) name = 'Q';
        else if (rank === 13) name = 'K';
        else if (rank === 14) name = 'A';
        
        deck.push({ suit, rank, name });
      }
    }

    // Shuffle deck using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  // Start a new poker game
  async startGame(tableId: string): Promise<any> {
    try {
      // Get table and players
      const { data: table } = await this.supabase
        .from('poker_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (!table) {
        throw new Error('Table not found');
      }

      const { data: players } = await this.supabase
        .from('poker_players')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'waiting')
        .order('seat_number');

      if (!players || players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      // Generate deck and deal cards
      const deck = this.generateDeck();
      const communityCards: Card[] = [];
      
      // Deal 2 cards to each player
      let cardIndex = 0;
      const playersWithCards = players.map(player => ({
        ...player,
        hole_cards: [deck[cardIndex++], deck[cardIndex++]],
        status: 'active',
        has_acted_this_round: false,
        current_bet: 0,
        total_bet_this_hand: 0,
        is_all_in: false
      }));

      // Set blinds
      const smallBlindPlayer = playersWithCards[0];
      const bigBlindPlayer = playersWithCards[1];
      
      // Deduct blinds from chip counts
      smallBlindPlayer.chip_count -= table.small_blind;
      smallBlindPlayer.current_bet = table.small_blind;
      smallBlindPlayer.total_bet_this_hand = table.small_blind;

      bigBlindPlayer.chip_count -= table.big_blind;
      bigBlindPlayer.current_bet = table.big_blind;
      bigBlindPlayer.total_bet_this_hand = table.big_blind;

      const pot = table.small_blind + table.big_blind;

      // Create game record
      const { data: game, error: gameError } = await this.supabase
        .from('poker_games')
        .insert({
          table_id: tableId,
          game_state: 'preflop',
          community_cards: communityCards,
          deck: deck.slice(cardIndex), // Remaining cards
          pot_amount: pot,
          current_bet: table.big_blind,
          current_player_turn: playersWithCards[2]?.user_id || playersWithCards[0].user_id,
          dealer_position: 0,
          betting_round: 0,
          minimum_bet: table.big_blind,
          players_in_hand: playersWithCards.map(p => p.user_id)
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Update players
      for (const player of playersWithCards) {
        await this.supabase
          .from('poker_players')
          .update({
            hole_cards: player.hole_cards,
            status: player.status,
            current_bet: player.current_bet,
            total_bet_this_hand: player.total_bet_this_hand,
            chip_count: player.chip_count,
            has_acted_this_round: player.has_acted_this_round,
            is_all_in: player.is_all_in
          })
          .eq('id', player.id);
      }

      // Update table status
      await this.supabase
        .from('poker_tables')
        .update({ status: 'active' })
        .eq('id', tableId);

      // Log game event
      await this.logGameEvent(game.id, 'game_started', {
        players: playersWithCards.map(p => ({ id: p.user_id, seat: p.seat_number })),
        blinds: { small: table.small_blind, big: table.big_blind }
      });

      return { success: true, game };
    } catch (error) {
      console.error('Error starting game:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle player action (bet, call, raise, fold, check)
  async handlePlayerAction(gameId: string, playerId: string, action: string, amount: number = 0): Promise<any> {
    try {
      // Get current game state
      const { data: game } = await this.supabase
        .from('poker_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!game || game.current_player_turn !== playerId) {
        throw new Error('Not your turn or game not found');
      }

      const { data: player } = await this.supabase
        .from('poker_players')
        .select('*')
        .eq('user_id', playerId)
        .eq('table_id', game.table_id)
        .single();

      if (!player) {
        throw new Error('Player not found');
      }

      let newChipCount = player.chip_count;
      let newCurrentBet = player.current_bet;
      let newTotalBet = player.total_bet_this_hand;
      let newPot = game.pot_amount;
      let playerStatus = player.status;
      let isAllIn = false;

      // Process action
      switch (action) {
        case 'fold':
          playerStatus = 'folded';
          break;

        case 'check':
          if (player.current_bet < game.current_bet) {
            throw new Error('Cannot check, must call or fold');
          }
          break;

        case 'call':
          const callAmount = game.current_bet - player.current_bet;
          if (callAmount > player.chip_count) {
            // All-in call
            newPot += player.chip_count;
            newTotalBet += player.chip_count;
            newCurrentBet = player.current_bet + player.chip_count;
            newChipCount = 0;
            isAllIn = true;
            playerStatus = 'all_in';
          } else {
            newChipCount -= callAmount;
            newCurrentBet += callAmount;
            newTotalBet += callAmount;
            newPot += callAmount;
          }
          break;

        case 'bet':
        case 'raise':
          if (amount < game.minimum_bet) {
            throw new Error(`Minimum bet is ${game.minimum_bet}`);
          }
          if (amount > player.chip_count) {
            throw new Error('Insufficient chips');
          }
          
          const totalBetAmount = amount;
          newChipCount -= totalBetAmount;
          newCurrentBet = totalBetAmount;
          newTotalBet += totalBetAmount;
          newPot += totalBetAmount;
          
          if (newChipCount === 0) {
            isAllIn = true;
            playerStatus = 'all_in';
          }
          break;

        default:
          throw new Error('Invalid action');
      }

      // Update player
      await this.supabase
        .from('poker_players')
        .update({
          chip_count: newChipCount,
          current_bet: newCurrentBet,
          total_bet_this_hand: newTotalBet,
          status: playerStatus,
          is_all_in: isAllIn,
          has_acted_this_round: true,
          last_action: action
        })
        .eq('id', player.id);

      // Log action
      await this.supabase
        .from('poker_actions')
        .insert({
          game_id: gameId,
          player_id: playerId,
          action_type: action,
          amount: amount,
          game_state: game.game_state
        });

      // Update game pot and check if betting round is complete
      const nextPlayer = await this.getNextPlayer(game, playerId);
      
      await this.supabase
        .from('poker_games')
        .update({
          pot_amount: newPot,
          current_bet: action === 'bet' || action === 'raise' ? newCurrentBet : game.current_bet,
          current_player_turn: nextPlayer?.user_id,
          last_action_time: new Date().toISOString()
        })
        .eq('id', gameId);

      // Check if we need to advance to next betting round
      const bettingComplete = await this.checkBettingRoundComplete(gameId);
      if (bettingComplete) {
        await this.advanceBettingRound(gameId);
      }

      // Log game event
      await this.logGameEvent(gameId, 'player_action', {
        player_id: playerId,
        action: action,
        amount: amount,
        new_pot: newPot
      });

      return { success: true, action, amount, new_pot: newPot };
    } catch (error) {
      console.error('Error handling player action:', error);
      return { success: false, error: error.message };
    }
  }

  // Get next active player
  async getNextPlayer(game: PokerGame, currentPlayerId: string): Promise<PokerPlayer | null> {
    const { data: players } = await this.supabase
      .from('poker_players')
      .select('*')
      .eq('table_id', game.table_id)
      .in('status', ['active', 'all_in'])
      .order('seat_number');

    if (!players || players.length === 0) return null;

    const currentIndex = players.findIndex(p => p.user_id === currentPlayerId);
    if (currentIndex === -1) return players[0];

    // Find next player who hasn't acted this round and isn't all-in
    for (let i = 1; i <= players.length; i++) {
      const nextIndex = (currentIndex + i) % players.length;
      const nextPlayer = players[nextIndex];
      if (nextPlayer.status === 'active' && !nextPlayer.has_acted_this_round) {
        return nextPlayer;
      }
    }

    return null;
  }

  // Check if betting round is complete
  async checkBettingRoundComplete(gameId: string): Promise<boolean> {
    const { data: game } = await this.supabase
      .from('poker_games')
      .select('*')
      .eq('id', gameId)
      .single();

    const { data: players } = await this.supabase
      .from('poker_players')
      .select('*')
      .eq('table_id', game.table_id)
      .in('status', ['active', 'all_in']);

    // All active players have acted and current bets are equal
    const activePlayers = players.filter(p => p.status === 'active');
    const allActed = activePlayers.every(p => p.has_acted_this_round);
    const equalBets = activePlayers.every(p => p.current_bet === game.current_bet);

    return allActed && equalBets;
  }

  // Advance to next betting round or showdown
  async advanceBettingRound(gameId: string): Promise<void> {
    const { data: game } = await this.supabase
      .from('poker_games')
      .select('*')
      .eq('id', gameId)
      .single();

    let newGameState = game.game_state;
    let newCommunityCards = [...game.community_cards];
    const deck = game.deck;
    let cardIndex = 0;

    // Reset player betting status
    await this.supabase
      .from('poker_players')
      .update({
        has_acted_this_round: false,
        current_bet: 0
      })
      .eq('table_id', game.table_id);

    switch (game.game_state) {
      case 'preflop':
        // Deal flop (3 cards)
        newCommunityCards = [deck[cardIndex++], deck[cardIndex++], deck[cardIndex++]];
        newGameState = 'flop';
        break;
      case 'flop':
        // Deal turn (1 card)
        newCommunityCards.push(deck[cardIndex++]);
        newGameState = 'turn';
        break;
      case 'turn':
        // Deal river (1 card)
        newCommunityCards.push(deck[cardIndex++]);
        newGameState = 'river';
        break;
      case 'river':
        // Showdown
        await this.handleShowdown(gameId);
        return;
    }

    await this.supabase
      .from('poker_games')
      .update({
        game_state: newGameState,
        community_cards: newCommunityCards,
        deck: deck.slice(cardIndex),
        current_bet: 0,
        betting_round: game.betting_round + 1
      })
      .eq('id', gameId);

    await this.logGameEvent(gameId, 'betting_round_advance', {
      new_state: newGameState,
      community_cards: newCommunityCards
    });
  }

  // Handle showdown and determine winner
  async handleShowdown(gameId: string): Promise<void> {
    const { data: game } = await this.supabase
      .from('poker_games')
      .select('*')
      .eq('id', gameId)
      .single();

    const { data: players } = await this.supabase
      .from('poker_players')
      .select('*')
      .eq('table_id', game.table_id)
      .in('status', ['active', 'all_in']);

    // Simplified winner determination (in production, implement proper hand evaluation)
    const winner = players[0]; // For now, just pick first player
    const winnings = game.pot_amount;

    // Update winner's chips
    await this.supabase
      .from('poker_players')
      .update({
        chip_count: winner.chip_count + winnings
      })
      .eq('id', winner.id);

    // Update game as completed
    await this.supabase
      .from('poker_games')
      .update({
        game_state: 'completed',
        winner_id: winner.user_id,
        completed_at: new Date().toISOString()
      })
      .eq('id', gameId);

    // Credit winner's wallet (optional - they can cash out later)
    await this.logGameEvent(gameId, 'game_completed', {
      winner_id: winner.user_id,
      winnings: winnings
    });

    // Reset table for next game
    await this.supabase
      .from('poker_tables')
      .update({ status: 'waiting' })
      .eq('id', game.table_id);
  }

  // Log game events for real-time updates
  async logGameEvent(gameId: string, eventType: string, eventData: any, playerId?: string): Promise<void> {
    await this.supabase
      .from('poker_game_events')
      .insert({
        game_id: gameId,
        event_type: eventType,
        event_data: eventData,
        player_id: playerId
      });
  }

  // Handle player timeout
  async handlePlayerTimeout(gameId: string, playerId: string): Promise<any> {
    try {
      // Auto-fold on timeout
      return await this.handlePlayerAction(gameId, playerId, 'fold');
    } catch (error) {
      console.error('Error handling timeout:', error);
      return { success: false, error: error.message };
    }
  }

  // Create session for player connection management
  async createPlayerSession(userId: string, tableId: string): Promise<any> {
    try {
      const sessionToken = crypto.randomUUID();
      
      const { data, error } = await this.supabase
        .from('poker_player_sessions')
        .upsert({
          user_id: userId,
          table_id: tableId,
          session_token: sessionToken,
          is_active: true,
          last_heartbeat: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, session_token: sessionToken };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  }

  // Update heartbeat for active connection
  async updateHeartbeat(sessionToken: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('poker_player_sessions')
        .update({
          last_heartbeat: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
        .eq('is_active', true);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating heartbeat:', error);
      return { success: false, error: error.message };
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const pokerManager = new PokerGameManager();

    let result;
    switch (action) {
      case 'start_game':
        result = await pokerManager.startGame(params.table_id);
        break;
      case 'player_action':
        result = await pokerManager.handlePlayerAction(
          params.game_id,
          params.player_id,
          params.action_type,
          params.amount
        );
        break;
      case 'player_timeout':
        result = await pokerManager.handlePlayerTimeout(params.game_id, params.player_id);
        break;
      case 'create_session':
        result = await pokerManager.createPlayerSession(params.user_id, params.table_id);
        break;
      case 'heartbeat':
        result = await pokerManager.updateHeartbeat(params.session_token);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in poker game manager:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});