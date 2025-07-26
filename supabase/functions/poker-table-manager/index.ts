import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTableParams {
  name: string;
  max_players?: number;
  small_blind: number;
  big_blind: number;
  buy_in_min: number;
  buy_in_max: number;
  table_type?: string;
}

class PokerTableManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }

  // Get list of available tables
  async getTables(userId?: string): Promise<any> {
    try {
      let query = this.supabase
        .from('poker_tables')
        .select(`
          *,
          poker_players (
            id,
            user_id,
            seat_number,
            chip_count,
            status,
            profiles (full_name)
          )
        `)
        .eq('table_type', 'public')
        .order('created_at', { ascending: false });

      const { data: tables, error } = await query;

      if (error) throw error;

      // Format response with player info
      const formattedTables = tables.map(table => ({
        ...table,
        players: table.poker_players || [],
        current_players: table.poker_players?.length || 0,
        is_full: (table.poker_players?.length || 0) >= table.max_players,
        can_join: userId ? !table.poker_players?.some(p => p.user_id === userId) : true
      }));

      return { success: true, tables: formattedTables };
    } catch (error) {
      console.error('Error getting tables:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new poker table
  async createTable(params: CreateTableParams, createdBy: string): Promise<any> {
    try {
      const { data: table, error } = await this.supabase
        .from('poker_tables')
        .insert({
          name: params.name,
          max_players: params.max_players || 6,
          small_blind: params.small_blind,
          big_blind: params.big_blind,
          buy_in_min: params.buy_in_min,
          buy_in_max: params.buy_in_max,
          table_type: params.table_type || 'public',
          created_by: createdBy,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, table };
    } catch (error) {
      console.error('Error creating table:', error);
      return { success: false, error: error.message };
    }
  }

  // Join a poker table
  async joinTable(tableId: string, userId: string, seatNumber: number, buyInAmount: number): Promise<any> {
    try {
      // Check if table exists and has space
      const { data: table } = await this.supabase
        .from('poker_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (!table) {
        throw new Error('Table not found');
      }

      if (table.current_players >= table.max_players) {
        throw new Error('Table is full');
      }

      // Check if seat is available
      const { data: existingSeat } = await this.supabase
        .from('poker_players')
        .select('id')
        .eq('table_id', tableId)
        .eq('seat_number', seatNumber)
        .single();

      if (existingSeat) {
        throw new Error('Seat is already taken');
      }

      // Check if user is already at table
      const { data: existingPlayer } = await this.supabase
        .from('poker_players')
        .select('id')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .single();

      if (existingPlayer) {
        throw new Error('Already seated at this table');
      }

      // Validate buy-in amount
      if (buyInAmount < table.buy_in_min || buyInAmount > table.buy_in_max) {
        throw new Error(`Buy-in must be between ${table.buy_in_min} and ${table.buy_in_max}`);
      }

      // Check wallet balance
      const { data: wallet } = await this.supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      if (!wallet || wallet.current_balance < buyInAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct buy-in from wallet
      const { error: walletError } = await this.supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: buyInAmount,
        p_type: 'debit',
        p_reason: `Poker table buy-in - ${table.name}`,
        p_game_type: 'casino',
        p_game_session_id: tableId
      });

      if (walletError) throw walletError;

      // Add player to table
      const { data: player, error: playerError } = await this.supabase
        .from('poker_players')
        .insert({
          table_id: tableId,
          user_id: userId,
          seat_number: seatNumber,
          chip_count: buyInAmount,
          status: 'waiting'
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Update table player count
      await this.supabase
        .from('poker_tables')
        .update({
          current_players: table.current_players + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      return { success: true, player, seat_number: seatNumber, chips: buyInAmount };
    } catch (error) {
      console.error('Error joining table:', error);
      return { success: false, error: error.message };
    }
  }

  // Leave a poker table
  async leaveTable(tableId: string, userId: string): Promise<any> {
    try {
      // Get player info
      const { data: player } = await this.supabase
        .from('poker_players')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .single();

      if (!player) {
        throw new Error('Player not found at this table');
      }

      // Check if player is in an active game
      const { data: activeGame } = await this.supabase
        .from('poker_games')
        .select('id')
        .eq('table_id', tableId)
        .in('game_state', ['preflop', 'flop', 'turn', 'river'])
        .single();

      if (activeGame && player.status === 'active') {
        throw new Error('Cannot leave during an active game');
      }

      // Return chips to wallet
      if (player.chip_count > 0) {
        const { error: walletError } = await this.supabase.rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: player.chip_count,
          p_type: 'credit',
          p_reason: `Poker table cash-out - Seat ${player.seat_number}`,
          p_game_type: 'casino',
          p_game_session_id: tableId
        });

        if (walletError) throw walletError;
      }

      // Remove player from table
      await this.supabase
        .from('poker_players')
        .delete()
        .eq('id', player.id);

      // Update table player count
      const { data: table } = await this.supabase
        .from('poker_tables')
        .select('current_players')
        .eq('id', tableId)
        .single();

      await this.supabase
        .from('poker_tables')
        .update({
          current_players: Math.max(0, (table?.current_players || 1) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      return { success: true, chips_returned: player.chip_count };
    } catch (error) {
      console.error('Error leaving table:', error);
      return { success: false, error: error.message };
    }
  }

  // Get table details with current game state
  async getTableDetails(tableId: string, userId?: string): Promise<any> {
    try {
      // Get table info
      const { data: table } = await this.supabase
        .from('poker_tables')
        .select(`
          *,
          poker_players (
            id,
            user_id,
            seat_number,
            chip_count,
            status,
            current_bet,
            total_bet_this_hand,
            is_all_in,
            has_acted_this_round,
            last_action,
            hole_cards,
            profiles (full_name)
          )
        `)
        .eq('id', tableId)
        .single();

      if (!table) {
        throw new Error('Table not found');
      }

      // Get current game if active
      const { data: currentGame } = await this.supabase
        .from('poker_games')
        .select('*')
        .eq('table_id', tableId)
        .in('game_state', ['preflop', 'flop', 'turn', 'river'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Filter hole cards - only show to the owning player
      const players = table.poker_players?.map(player => ({
        ...player,
        hole_cards: player.user_id === userId ? player.hole_cards : null
      })) || [];

      // Get recent events for this table's current game
      let recentEvents = [];
      if (currentGame) {
        const { data: events } = await this.supabase
          .from('poker_game_events')
          .select('*')
          .eq('game_id', currentGame.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        recentEvents = events || [];
      }

      return {
        success: true,
        table: {
          ...table,
          players,
          current_game: currentGame,
          recent_events: recentEvents
        }
      };
    } catch (error) {
      console.error('Error getting table details:', error);
      return { success: false, error: error.message };
    }
  }

  // Get player's game history
  async getPlayerHistory(userId: string, limit: number = 10): Promise<any> {
    try {
      const { data: history, error } = await this.supabase
        .from('poker_hand_history')
        .select(`
          *,
          poker_tables (name, small_blind, big_blind)
        `)
        .or(`winner_id.eq.${userId},players_data.cs.{"${userId}"}`)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, history: history || [] };
    } catch (error) {
      console.error('Error getting player history:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up inactive players (called by cron job)
  async cleanupInactivePlayers(): Promise<any> {
    try {
      const { error } = await this.supabase.rpc('cleanup_inactive_poker_players');
      
      if (error) throw error;

      return { success: true, message: 'Cleanup completed' };
    } catch (error) {
      console.error('Error cleaning up inactive players:', error);
      return { success: false, error: error.message };
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const tableManager = new PokerTableManager();

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!
        );
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (e) {
        console.log('Auth error:', e);
      }
    }

    let result;

    if (req.method === 'GET') {
      if (path === '/tables') {
        result = await tableManager.getTables(userId);
      } else if (path.startsWith('/table/')) {
        const tableId = path.split('/')[2];
        result = await tableManager.getTableDetails(tableId, userId);
      } else if (path === '/history' && userId) {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        result = await tableManager.getPlayerHistory(userId, limit);
      } else if (path === '/cleanup') {
        result = await tableManager.cleanupInactivePlayers();
      } else {
        result = { success: false, error: 'Invalid endpoint' };
      }
    } else if (req.method === 'POST') {
      const body = await req.json();

      if (path === '/create-table' && userId) {
        result = await tableManager.createTable(body, userId);
      } else if (path === '/join-table' && userId) {
        result = await tableManager.joinTable(
          body.table_id,
          userId,
          body.seat_number,
          body.buy_in_amount
        );
      } else if (path === '/leave-table' && userId) {
        result = await tableManager.leaveTable(body.table_id, userId);
      } else {
        result = { success: false, error: 'Invalid endpoint or unauthorized' };
      }
    } else {
      result = { success: false, error: 'Method not allowed' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in poker table manager:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});