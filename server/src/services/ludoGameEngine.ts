import { supabase } from '../config/supabase';
import crypto from 'crypto';

export interface GameState {
  players: Record<string, PlayerData>;
  currentPlayer: string;
  gamePhase: 'rolling' | 'moving' | 'completed';
  lastDiceRoll?: number;
  consecutiveSixes: number;
}

export interface PlayerData {
  tokens: TokenData[];
  isBot: boolean;
  difficulty?: 'easy' | 'normal' | 'pro';
}

export interface TokenData {
  id: string;
  position: number; // -1 for base, 0-51 for board, 52-57 for home path
  isInHome: boolean;
  canMove: boolean;
}

export interface LegalMove {
  tokenId: string;
  fromPosition: number;
  toPosition: number;
  isCapture: boolean;
  isHome: boolean;
}

export class LudoGameEngine {
  private prng: any;

  // Initialize board for new match
  initializeBoard(mode: '2p' | '4p'): GameState {
    const players: Record<string, PlayerData> = {};
    const playerColors = mode === '2p' ? ['P1', 'P2'] : ['P1', 'P2', 'P3', 'P4'];
    
    playerColors.forEach((player, index) => {
      players[player] = {
        tokens: Array.from({ length: 4 }, (_, i) => ({
          id: `${player}_${i}`,
          position: -1, // All tokens start in base
          isInHome: false,
          canMove: false
        })),
        isBot: index > 0, // P1 is human, others are bots
        difficulty: 'normal'
      };
    });

    return {
      players,
      currentPlayer: 'P1',
      gamePhase: 'rolling',
      consecutiveSixes: 0
    };
  }

  // Seeded random number generator
  private seedRandom(seed: string) {
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    let seedValue = parseInt(hash.substring(0, 8), 16);
    
    return function() {
      seedValue = (seedValue * 1664525 + 1013904223) % Math.pow(2, 32);
      return seedValue / Math.pow(2, 32);
    };
  }

  // Roll dice for current player
  async rollDice(matchId: string, userId: string, idempotencyKey: string) {
    // Get current match state
    const { data: matchData } = await supabase
      .from('ludo_matches')
      .select(`
        *,
        ludo_match_state (*)
      `)
      .eq('id', matchId)
      .eq('user_id', userId)
      .single();

    if (!matchData || matchData.status !== 'in_progress') {
      throw new Error('Match not found or not in progress');
    }

    const state = matchData.ludo_match_state[0];
    const gameState: GameState = state.board;

    // Verify it's P1's turn (human player)
    if (gameState.currentPlayer !== 'P1') {
      throw new Error('Not your turn');
    }

    // Initialize seeded PRNG
    this.prng = this.seedRandom(state.seed + state.dice_history.length);
    
    // Roll dice (1-6)
    const dice = Math.floor(this.prng() * 6) + 1;
    
    // Update consecutive sixes tracking
    let consecutiveSixes = dice === 6 ? state.consecutive_sixes + 1 : 0;
    
    // Three consecutive sixes rule - forfeit turn
    if (consecutiveSixes >= 3) {
      consecutiveSixes = 0;
      gameState.currentPlayer = this.getNextPlayer(gameState.currentPlayer, Object.keys(gameState.players).length);
      gameState.gamePhase = 'rolling';
    } else {
      gameState.lastDiceRoll = dice;
      gameState.consecutiveSixes = consecutiveSixes;
      gameState.gamePhase = 'moving';
    }

    // Calculate legal moves
    const legalMoves = this.calculateLegalMoves(gameState, 'P1', dice);
    
    // Update database
    const newDiceHistory = [...state.dice_history, dice];
    await supabase
      .from('ludo_match_state')
      .update({
        board: gameState,
        dice_history: newDiceHistory,
        consecutive_sixes: consecutiveSixes,
        updated_at: new Date().toISOString()
      })
      .eq('match_id', matchId);

    // Log the roll
    await supabase
      .from('ludo_match_logs')
      .insert({
        match_id: matchId,
        actor: 'P1',
        action: 'roll_dice',
        payload: { 
          dice, 
          legalMoves, 
          consecutiveSixes,
          idempotencyKey,
          stateHash: this.generateStateHash(gameState)
        }
      });

    return {
      dice,
      legalMoves,
      stateHash: this.generateStateHash(gameState)
    };
  }

  // Make a move
  async makeMove(matchId: string, userId: string, moveId: string, stateHash: string, idempotencyKey: string) {
    // Get current match state
    const { data: matchData } = await supabase
      .from('ludo_matches')
      .select(`
        *,
        ludo_match_state (*)
      `)
      .eq('id', matchId)
      .eq('user_id', userId)
      .single();

    if (!matchData || matchData.status !== 'in_progress') {
      throw new Error('Match not found or not in progress');
    }

    const state = matchData.ludo_match_state[0];
    const gameState: GameState = state.board;

    // Verify state hash
    if (this.generateStateHash(gameState) !== stateHash) {
      throw new Error('State mismatch - please refresh');
    }

    // Verify it's P1's turn and in moving phase
    if (gameState.currentPlayer !== 'P1' || gameState.gamePhase !== 'moving') {
      throw new Error('Invalid move timing');
    }

    // Parse move
    const [tokenId, targetPositionStr] = moveId.split(':');
    const targetPosition = parseInt(targetPositionStr);

    // Validate and execute move
    const moveResult = this.executeMove(gameState, 'P1', tokenId, targetPosition);
    
    if (!moveResult.valid) {
      throw new Error('Invalid move');
    }

    // Check for win condition
    const hasWon = this.checkWinCondition(gameState, 'P1');
    
    if (hasWon) {
      gameState.gamePhase = 'completed';
      
      // Update match as completed
      await supabase
        .from('ludo_matches')
        .update({
          status: 'completed',
          winner: 'P1',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      // Credit winnings (2x entry fee)
      const winAmount = matchData.entry_fee * 2;
      
      await supabase
        .from('ludo_users')
        .update({ 
          wallet_balance: supabase.rpc('increment', { 
            column_name: 'wallet_balance', 
            increment_value: winAmount 
          })
        })
        .eq('id', userId);

      // Record win transaction
      await supabase
        .from('ludo_wallet_transactions')
        .insert({
          user_id: userId,
          match_id: matchId,
          amount: winAmount,
          type: 'win',
          meta: { winner: 'P1' }
        });
    } else {
      // Continue game - determine next player
      const shouldGetExtraTurn = gameState.lastDiceRoll === 6 || moveResult.isCapture;
      
      if (!shouldGetExtraTurn) {
        gameState.currentPlayer = this.getNextPlayer(gameState.currentPlayer, Object.keys(gameState.players).length);
        gameState.consecutiveSixes = 0;
      }
      
      gameState.gamePhase = 'rolling';
    }

    // Update game state
    await supabase
      .from('ludo_match_state')
      .update({
        board: gameState,
        last_move: moveResult,
        updated_at: new Date().toISOString()
      })
      .eq('match_id', matchId);

    // Log the move
    await supabase
      .from('ludo_match_logs')
      .insert({
        match_id: matchId,
        actor: 'P1',
        action: 'move_token',
        payload: {
          tokenId,
          targetPosition,
          moveResult,
          hasWon,
          idempotencyKey
        }
      });

    // If game continues and it's a bot's turn, simulate bot moves
    if (!hasWon && gameState.currentPlayer !== 'P1') {
      await this.simulateBotTurns(matchId, gameState, state.seed);
    }

    return {
      success: true,
      gameState,
      hasWon,
      moveResult
    };
  }

  // Calculate legal moves for a player
  private calculateLegalMoves(gameState: GameState, player: string, dice: number): LegalMove[] {
    const moves: LegalMove[] = [];
    const playerData = gameState.players[player];
    
    if (!playerData) return moves;

    playerData.tokens.forEach(token => {
      if (token.position === -1) {
        // Token in base - can only move out with 6
        if (dice === 6) {
          const startPosition = this.getPlayerStartPosition(player);
          moves.push({
            tokenId: token.id,
            fromPosition: -1,
            toPosition: startPosition,
            isCapture: false,
            isHome: false
          });
        }
      } else if (!token.isInHome) {
        // Token on board
        const newPosition = token.position + dice;
        
        // Check if move is within bounds
        if (newPosition <= 51 || this.canEnterHomePath(player, newPosition)) {
          const finalPosition = this.calculateFinalPosition(player, newPosition);
          const isCapture = this.isPositionOccupiedByOpponent(gameState, player, finalPosition);
          const isHome = finalPosition >= 52;
          
          moves.push({
            tokenId: token.id,
            fromPosition: token.position,
            toPosition: finalPosition,
            isCapture,
            isHome
          });
        }
      }
    });

    return moves;
  }

  // Execute a move
  private executeMove(gameState: GameState, player: string, tokenId: string, targetPosition: number) {
    const playerData = gameState.players[player];
    const token = playerData.tokens.find(t => t.id === tokenId);
    
    if (!token) {
      return { valid: false, reason: 'Token not found' };
    }

    const isCapture = this.isPositionOccupiedByOpponent(gameState, player, targetPosition);
    
    // Handle capture
    if (isCapture) {
      this.captureOpponentToken(gameState, player, targetPosition);
    }

    // Move token
    token.position = targetPosition;
    token.isInHome = targetPosition >= 52;
    
    // Update all tokens' canMove status
    this.updateTokenMoveability(gameState, player);

    return {
      valid: true,
      isCapture,
      isHome: token.isInHome,
      tokenId,
      targetPosition
    };
  }

  // Simulate bot turns
  private async simulateBotTurns(matchId: string, gameState: GameState, seed: string) {
    let botTurnCount = 0;
    
    while (gameState.currentPlayer !== 'P1' && gameState.gamePhase !== 'completed' && botTurnCount < 10) {
      botTurnCount++;
      
      // Simulate bot turn with delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const botPlayer = gameState.currentPlayer;
      const botData = gameState.players[botPlayer];
      
      // Bot rolls dice
      this.prng = this.seedRandom(seed + Date.now().toString());
      const dice = Math.floor(this.prng() * 6) + 1;
      
      // Calculate bot moves
      const legalMoves = this.calculateLegalMoves(gameState, botPlayer, dice);
      
      if (legalMoves.length > 0) {
        // Bot selects best move based on difficulty
        const selectedMove = this.selectBotMove(legalMoves, botData.difficulty || 'normal');
        this.executeMove(gameState, botPlayer, selectedMove.tokenId, selectedMove.toPosition);
        
        // Check if bot won
        if (this.checkWinCondition(gameState, botPlayer)) {
          gameState.gamePhase = 'completed';
          
          // Update match as completed with bot winner
          await supabase
            .from('ludo_matches')
            .update({
              status: 'completed',
              winner: botPlayer,
              completed_at: new Date().toISOString()
            })
            .eq('id', matchId);
          
          break;
        }
      }
      
      // Determine next player
      const shouldGetExtraTurn = dice === 6 || (legalMoves.length > 0 && legalMoves[0].isCapture);
      
      if (!shouldGetExtraTurn) {
        gameState.currentPlayer = this.getNextPlayer(gameState.currentPlayer, Object.keys(gameState.players).length);
      }
      
      gameState.gamePhase = 'rolling';
    }
    
    // Update final state
    await supabase
      .from('ludo_match_state')
      .update({
        board: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('match_id', matchId);
  }

  // Bot move selection based on difficulty
  private selectBotMove(legalMoves: LegalMove[], difficulty: string): LegalMove {
    // Sort moves by priority
    const sortedMoves = legalMoves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Prioritize home moves
      if (a.isHome) scoreA += 100;
      if (b.isHome) scoreB += 100;
      
      // Prioritize captures
      if (a.isCapture) scoreA += 50;
      if (b.isCapture) scoreB += 50;
      
      // Prioritize forward movement
      scoreA += a.toPosition - a.fromPosition;
      scoreB += b.toPosition - b.fromPosition;
      
      return scoreB - scoreA;
    });
    
    // Add randomness based on difficulty
    switch (difficulty) {
      case 'easy':
        // 30% chance to pick random move
        if (Math.random() < 0.3) {
          return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }
        break;
      case 'pro':
        // Always pick best move
        return sortedMoves[0];
      default: // normal
        // 10% chance for suboptimal move
        if (Math.random() < 0.1 && sortedMoves.length > 1) {
          return sortedMoves[1];
        }
        break;
    }
    
    return sortedMoves[0];
  }

  // Helper methods
  private getPlayerStartPosition(player: string): number {
    const startPositions = { P1: 1, P2: 14, P3: 27, P4: 40 };
    return startPositions[player as keyof typeof startPositions] || 1;
  }

  private getNextPlayer(currentPlayer: string, totalPlayers: number): string {
    const playerIndex = parseInt(currentPlayer.substring(1)) - 1;
    const nextIndex = (playerIndex + 1) % totalPlayers;
    return `P${nextIndex + 1}`;
  }

  private canEnterHomePath(player: string, position: number): boolean {
    // Logic for entering home path based on player color
    return position > 51;
  }

  private calculateFinalPosition(player: string, position: number): number {
    if (position <= 51) return position;
    
    // Home path calculation
    const homeStart = 52;
    const homeOffset = position - 52;
    return homeStart + homeOffset;
  }

  private isPositionOccupiedByOpponent(gameState: GameState, player: string, position: number): boolean {
    // Check safe positions
    const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
    if (safePositions.includes(position)) return false;

    for (const [otherPlayer, data] of Object.entries(gameState.players)) {
      if (otherPlayer === player) continue;
      
      for (const token of data.tokens) {
        if (token.position === position && !token.isInHome) {
          return true;
        }
      }
    }
    
    return false;
  }

  private captureOpponentToken(gameState: GameState, player: string, position: number) {
    for (const [otherPlayer, data] of Object.entries(gameState.players)) {
      if (otherPlayer === player) continue;
      
      for (const token of data.tokens) {
        if (token.position === position && !token.isInHome) {
          token.position = -1; // Send back to base
          token.isInHome = false;
          break;
        }
      }
    }
  }

  private updateTokenMoveability(gameState: GameState, player: string) {
    const playerData = gameState.players[player];
    playerData.tokens.forEach(token => {
      token.canMove = false; // Reset for next turn
    });
  }

  private checkWinCondition(gameState: GameState, player: string): boolean {
    const playerData = gameState.players[player];
    return playerData.tokens.every(token => token.isInHome);
  }

  private generateStateHash(gameState: GameState): string {
    return crypto.createHash('md5').update(JSON.stringify(gameState)).digest('hex');
  }
}