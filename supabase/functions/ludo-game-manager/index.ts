import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Game state management
interface GameState {
  currentPlayer: number;
  diceValue: number | null;
  isRolling: boolean;
  winner: string | null;
  canRoll: boolean;
  consecutiveSixes: number;
  turnTimeoutAt: string | null;
  tokens: Record<string, TokenState[]>;
}

interface TokenState {
  id: string;
  player: string;
  position: 'base' | 'board' | 'home';
  boardPosition: number | null;
  isHome: boolean;
  canMove: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Use service role key for admin operations, but forward user auth for RLS
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: {
          headers: {
            // Forward the user's auth so RLS functions (auth.uid()) work
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { action, roomId, playerId, moveData } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Ludo game action: ${action} for room ${roomId}`);

    switch (action) {
      case 'create_room':
        return await createRoom(supabaseClient, moveData);
      
      case 'join_room':
        return await joinRoom(supabaseClient, roomId, playerId);
      
      case 'start_game_with_bots':
        return await startGameWithBots(supabaseClient, roomId, moveData?.botDifficulty);
      
      case 'roll_dice':
        return await rollDice(supabaseClient, roomId, playerId);
      
      case 'move_token':
        return await moveToken(supabaseClient, roomId, playerId, moveData);
      
      case 'heartbeat':
        return await updateHeartbeat(supabaseClient, roomId, playerId);
      
      case 'forfeit':
        return await forfeitGame(supabaseClient, roomId, playerId);
      
      case 'get_room_state':
        return await getRoomState(supabaseClient, roomId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Ludo game manager error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        details: error?.details || null
      }),
      { 
        status: error?.status || 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createRoom(supabaseClient: any, { maxPlayers, entryFee }: any) {
  try {
    console.log('Creating room with:', { maxPlayers, entryFee });
    
    // Validate inputs
    if (!maxPlayers || (maxPlayers !== 2 && maxPlayers !== 4)) {
      throw new Error('Max players must be 2 or 4');
    }
    
    if (!entryFee || entryFee < 1 || entryFee > 1000) {
      throw new Error('Entry fee must be between ₹1 and ₹1000');
    }

    const { data, error } = await supabaseClient.rpc('create_ludo_room', {
      p_max_players: maxPlayers,
      p_entry_fee: entryFee
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error(error.message || 'Failed to create room');
    }

    if (!data || !data.room_id) {
      throw new Error('Room creation failed: No room ID returned');
    }

    console.log('Room created successfully:', data.room_id);

    // Initialize game state
    const gameState: GameState = {
      currentPlayer: 1,
      diceValue: null,
      isRolling: false,
      winner: null,
      canRoll: true,
      consecutiveSixes: 0,
      turnTimeoutAt: null,
      tokens: initializeTokens(maxPlayers)
    };

    // Update room with initial game state
    const { error: updateError } = await supabaseClient
      .from('ludo_rooms')
      .update({ game_state: gameState })
      .eq('id', data.room_id);

    if (updateError) {
      console.error('Error updating game state:', updateError);
      // Don't throw, room is already created successfully
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in createRoom:', error);
    throw error;
  }
}

async function joinRoom(supabaseClient: any, roomId: string, playerId: string) {
  const { data, error } = await supabaseClient.rpc('join_ludo_room', {
    p_room_id: roomId
  });

  if (error) throw error;

  // If room is now full, start the game
  if (data.room_full) {
    await startGame(supabaseClient, roomId);
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function rollDice(supabaseClient: any, roomId: string, playerId: string) {
  // Get current room state
  const { data: room } = await supabaseClient
    .from('ludo_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room || room.status !== 'active') {
    throw new Error('Game not active');
  }

  const gameState = room.game_state as GameState;
  
  // Verify it's the player's turn
  const { data: playerSession } = await supabaseClient
    .from('ludo_player_sessions')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .single();

  if (!playerSession || playerSession.player_position !== gameState.currentPlayer) {
    throw new Error('Not your turn');
  }

  // Generate server-side dice roll (1-6)
  const diceValue = Math.floor(Math.random() * 6) + 1;
  
  // Log the move
  await supabaseClient
    .from('ludo_moves')
    .insert({
      room_id: roomId,
      player_id: playerId,
      move_type: 'roll_dice',
      dice_value: diceValue
    });

  // Update game state
  const updatedGameState = {
    ...gameState,
    diceValue,
    isRolling: false,
    canRoll: false,
    consecutiveSixes: diceValue === 6 ? gameState.consecutiveSixes + 1 : 0
  };

  // Update tokens that can move
  updatedGameState.tokens = updateMovableTokens(
    updatedGameState.tokens,
    playerSession.player_color,
    diceValue
  );

  // Set turn timeout (30 seconds)
  const turnTimeoutAt = new Date(Date.now() + 30000).toISOString();
  updatedGameState.turnTimeoutAt = turnTimeoutAt;

  // Update room state
  await supabaseClient
    .from('ludo_rooms')
    .update({ game_state: updatedGameState })
    .eq('id', roomId);

  // Update player session timeout
  await supabaseClient
    .from('ludo_player_sessions')
    .update({ turn_timeout_at: turnTimeoutAt })
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      diceValue,
      gameState: updatedGameState
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function moveToken(supabaseClient: any, roomId: string, playerId: string, moveData: any) {
  const { tokenId, targetPosition } = moveData;

  // Get current room state
  const { data: room } = await supabaseClient
    .from('ludo_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room || room.status !== 'active') {
    throw new Error('Game not active');
  }

  const gameState = room.game_state as GameState;
  
  // Verify it's the player's turn
  const { data: playerSession } = await supabaseClient
    .from('ludo_player_sessions')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .single();

  if (!playerSession || playerSession.player_position !== gameState.currentPlayer) {
    throw new Error('Not your turn');
  }

  // Validate move
  const playerTokens = gameState.tokens[playerSession.player_color] || [];
  const token = playerTokens.find(t => t.id === tokenId);
  
  if (!token || !token.canMove) {
    throw new Error('Invalid move');
  }

  // Calculate new position and validate
  const newPosition = calculateNewPosition(token, gameState.diceValue!, playerSession.player_color);
  
  if (newPosition !== targetPosition) {
    throw new Error('Invalid target position');
  }

  // Check for kills
  const killedToken = checkForKills(gameState.tokens, newPosition, playerSession.player_color);

  // Update token position
  const updatedTokens = { ...gameState.tokens };
  const tokenIndex = updatedTokens[playerSession.player_color].findIndex(t => t.id === tokenId);
  
  updatedTokens[playerSession.player_color][tokenIndex] = {
    ...token,
    boardPosition: newPosition,
    position: newPosition >= 57 ? 'home' : 'board',
    isHome: newPosition >= 57,
    canMove: false
  };

  // Handle kills
  if (killedToken) {
    const killedColor = killedToken.color;
    const killedIndex = updatedTokens[killedColor].findIndex(t => t.id === killedToken.id);
    
    updatedTokens[killedColor][killedIndex] = {
      ...updatedTokens[killedColor][killedIndex],
      position: 'base',
      boardPosition: null,
      isHome: false,
      canMove: false
    };
  }

  // Log the move
  await supabaseClient
    .from('ludo_moves')
    .insert({
      room_id: roomId,
      player_id: playerId,
      move_type: 'move_token',
      token_id: tokenId,
      from_position: token.boardPosition,
      to_position: newPosition,
      killed_token_id: killedToken?.id || null,
      move_data: moveData
    });

  // Check for win condition
  const hasWon = checkWinCondition(updatedTokens[playerSession.player_color]);
  let winner = null;

  if (hasWon) {
    winner = playerId;
    await completeGame(supabaseClient, roomId, playerId);
  }

  // Determine next turn
  let nextPlayer = gameState.currentPlayer;
  const shouldGetAnotherTurn = gameState.diceValue === 6 || killedToken;
  
  if (!shouldGetAnotherTurn && !hasWon) {
    nextPlayer = getNextPlayer(gameState.currentPlayer, room.max_players);
  }

  // Update game state
  const updatedGameState: GameState = {
    ...gameState,
    tokens: updatedTokens,
    currentPlayer: nextPlayer,
    diceValue: null,
    canRoll: true,
    winner,
    turnTimeoutAt: null,
    consecutiveSixes: gameState.diceValue === 6 ? gameState.consecutiveSixes : 0
  };

  // Clear all token canMove flags
  Object.keys(updatedGameState.tokens).forEach(color => {
    updatedGameState.tokens[color].forEach(t => t.canMove = false);
  });

  // Update room state
  await supabaseClient
    .from('ludo_rooms')
    .update({ 
      game_state: updatedGameState,
      winner_id: winner,
      status: hasWon ? 'completed' : 'active'
    })
    .eq('id', roomId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      gameState: updatedGameState,
      killedToken,
      hasWon
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateHeartbeat(supabaseClient: any, roomId: string, playerId: string) {
  await supabaseClient
    .from('ludo_player_sessions')
    .update({ 
      last_heartbeat: new Date().toISOString(),
      is_online: true
    })
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function forfeitGame(supabaseClient: any, roomId: string, playerId: string) {
  // Mark player as offline
  await supabaseClient
    .from('ludo_player_sessions')
    .update({ is_online: false })
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  // Log forfeit move
  await supabaseClient
    .from('ludo_moves')
    .insert({
      room_id: roomId,
      player_id: playerId,
      move_type: 'forfeit'
    });

  // Check if game should end (only one player left)
  const { data: onlinePlayers } = await supabaseClient
    .from('ludo_player_sessions')
    .select('player_id')
    .eq('room_id', roomId)
    .eq('is_online', true);

  if (onlinePlayers && onlinePlayers.length === 1) {
    // Last player wins
    await completeGame(supabaseClient, roomId, onlinePlayers[0].player_id);
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getRoomState(supabaseClient: any, roomId: string) {
  const { data: room } = await supabaseClient
    .from('ludo_rooms')
    .select(`
      *,
      ludo_player_sessions(*)
    `)
    .eq('id', roomId)
    .single();

  if (!room) {
    throw new Error('Room not found');
  }

  return new Response(
    JSON.stringify(room),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function initializeTokens(maxPlayers: number): Record<string, TokenState[]> {
  const colors = maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'blue', 'yellow', 'green'];
  const tokens: Record<string, TokenState[]> = {};

  for (let i = 0; i < maxPlayers; i++) {
    const color = colors[i];
    tokens[color] = Array.from({ length: 4 }, (_, index) => ({
      id: `${color}-${index + 1}`,
      player: color,
      position: 'base' as const,
      boardPosition: null,
      isHome: false,
      canMove: false
    }));
  }

  return tokens;
}

async function startGameWithBots(supabaseClient: any, roomId: string, botDifficulty: string = 'normal') {
  // Get room details
  const { data: room } = await supabaseClient
    .from('ludo_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room) {
    throw new Error('Room not found');
  }

  // Add bot players to fill the room
  const botsNeeded = room.max_players - room.current_players;
  const colors = room.max_players === 2 ? ['red', 'yellow'] : ['red', 'blue', 'yellow', 'green'];
  
  // Get existing player colors
  const { data: existingSessions } = await supabaseClient
    .from('ludo_player_sessions')
    .select('player_color')
    .eq('room_id', roomId);

  const usedColors = existingSessions?.map(s => s.player_color) || [];
  const availableColors = colors.filter(c => !usedColors.includes(c));

  // Add bot players
  for (let i = 0; i < botsNeeded; i++) {
    const botColor = availableColors[i];
    const botId = `bot_${roomId}_${i + 1}`;
    
    await supabaseClient
      .from('ludo_player_sessions')
      .insert({
        room_id: roomId,
        player_id: botId,
        player_position: room.current_players + i + 1,
        player_color: botColor,
        is_bot: true,
        bot_difficulty: botDifficulty,
        is_online: true
      });
  }

  // Update room status to active
  await supabaseClient
    .from('ludo_rooms')
    .update({
      status: 'active',
      current_players: room.max_players,
      started_at: new Date().toISOString()
    })
    .eq('id', roomId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      status: 'active',
      message: `Game started with ${botsNeeded} bot players`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function updateMovableTokens(tokens: Record<string, TokenState[]>, playerColor: string, diceValue: number): Record<string, TokenState[]> {
  const updatedTokens = { ...tokens };
  
  updatedTokens[playerColor] = updatedTokens[playerColor].map(token => ({
    ...token,
    canMove: canTokenMove(token, diceValue)
  }));

  return updatedTokens;
}

function canTokenMove(token: TokenState, diceValue: number): boolean {
  // Token in base can only move with 6
  if (token.position === 'base') {
    return diceValue === 6;
  }
  
  // Token at home cannot move
  if (token.position === 'home') {
    return false;
  }
  
  // Token on board can move if it doesn't exceed home position
  const newPosition = (token.boardPosition || 0) + diceValue;
  return newPosition <= 57; // 52 regular positions + 5 home positions
}

function calculateNewPosition(token: TokenState, diceValue: number, playerColor: string): number {
  if (token.position === 'base') {
    // Starting positions for each color
    const startPositions = { red: 1, blue: 14, yellow: 27, green: 40 };
    return startPositions[playerColor as keyof typeof startPositions];
  }
  
  return (token.boardPosition || 0) + diceValue;
}

function checkForKills(tokens: Record<string, TokenState[]>, position: number, playerColor: string): { id: string; color: string } | null {
  // Safe positions where kills cannot happen
  const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
  
  if (safePositions.includes(position)) {
    return null;
  }

  // Check if any opponent token is at this position
  for (const [color, colorTokens] of Object.entries(tokens)) {
    if (color === playerColor) continue;
    
    for (const token of colorTokens) {
      if (token.boardPosition === position && token.position === 'board') {
        return { id: token.id, color };
      }
    }
  }

  return null;
}

function checkWinCondition(playerTokens: TokenState[]): boolean {
  return playerTokens.every(token => token.isHome);
}

function getNextPlayer(currentPlayer: number, maxPlayers: number): number {
  return currentPlayer >= maxPlayers ? 1 : currentPlayer + 1;
}

async function startGame(supabaseClient: any, roomId: string) {
  // Game automatically starts when room is full
  console.log(`Starting game for room ${roomId}`);
}

async function completeGame(supabaseClient: any, roomId: string, winnerId: string) {
  const { data, error } = await supabaseClient.rpc('complete_ludo_game', {
    p_room_id: roomId,
    p_winner_id: winnerId
  });

  if (error) {
    console.error('Error completing game:', error);
    throw error;
  }

  console.log(`Game completed. Winner: ${winnerId}, Amount: ${data.winner_amount}`);
  return data;
}
