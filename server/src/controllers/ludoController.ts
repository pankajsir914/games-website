import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { LudoGameEngine } from '../services/ludoGameEngine';
import { AuthRequest } from '../middleware/ludoAuth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class LudoController {
  private gameEngine = new LudoGameEngine();

  // POST /auth/login - User authentication
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      // Get user from database
      const { data: user, error } = await supabase
        .from('ludo_users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is suspended' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username 
        },
        process.env.JWT_SECRET!,
        { 
          expiresIn: '12h' 
        }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          walletBalance: user.wallet_balance
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /wallet - Get current wallet balance
  async getWallet(req: AuthRequest, res: Response) {
    try {
      const { data: user, error } = await supabase
        .from('ludo_users')
        .select('wallet_balance')
        .eq('id', req.user!.id)
        .single();

      if (error) throw error;

      res.json({ balance: user.wallet_balance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /ludo/create - Create new match
  async createMatch(req: AuthRequest, res: Response) {
    try {
      const { mode, entryFee, botDifficulty } = req.body;

      // Validate entry fee
      if (entryFee < 100) {
        return res.status(400).json({ error: 'Minimum entry fee is 100 tokens' });
      }

      // Check user balance
      const { data: user, error: userError } = await supabase
        .from('ludo_users')
        .select('wallet_balance')
        .eq('id', req.user!.id)
        .single();

      if (userError) throw userError;

      if (user.wallet_balance < entryFee) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct entry fee
      const { error: deductError } = await supabase
        .from('ludo_users')
        .update({ wallet_balance: user.wallet_balance - entryFee })
        .eq('id', req.user!.id);

      if (deductError) throw deductError;

      // Generate seed for deterministic PRNG
      const seed = crypto.randomBytes(32).toString('hex');

      // Create match
      const { data: match, error: matchError } = await supabase
        .from('ludo_matches')
        .insert({
          user_id: req.user!.id,
          mode,
          entry_fee: entryFee,
          status: 'in_progress',
          bot_difficulty
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Initialize game state
      const initialBoard = this.gameEngine.initializeBoard(mode);
      
      const { error: stateError } = await supabase
        .from('ludo_match_state')
        .insert({
          match_id: match.id,
          turn: 'P1',
          dice_history: [],
          consecutive_sixes: 0,
          board: initialBoard,
          seed
        });

      if (stateError) throw stateError;

      // Record transaction
      await supabase
        .from('ludo_wallet_transactions')
        .insert({
          user_id: req.user!.id,
          match_id: match.id,
          amount: entryFee,
          type: 'entry',
          meta: { mode, bot_difficulty }
        });

      // Log match creation
      await supabase
        .from('ludo_match_logs')
        .insert({
          match_id: match.id,
          actor: 'system',
          action: 'match_created',
          payload: { mode, entry_fee: entryFee, bot_difficulty }
        });

      res.status(201).json({ matchId: match.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /ludo/state/:matchId - Get match state
  async getMatchState(req: AuthRequest, res: Response) {
    try {
      const { matchId } = req.params;

      const { data: match, error: matchError } = await supabase
        .from('ludo_matches')
        .select(`
          *,
          ludo_match_state (*)
        `)
        .eq('id', matchId)
        .eq('user_id', req.user!.id)
        .single();

      if (matchError) throw matchError;

      const state = match.ludo_match_state[0];
      
      res.json({
        turn: state.turn,
        board: state.board,
        diceHistory: state.dice_history.slice(-10), // Last 10 rolls
        consecutiveSixes: state.consecutive_sixes,
        winner: match.winner,
        status: match.status
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /ludo/roll - Roll dice
  async rollDice(req: AuthRequest, res: Response) {
    try {
      const { matchId, idempotencyKey } = req.body;

      // Check idempotency
      const { data: existingRoll } = await supabase
        .from('ludo_match_logs')
        .select('*')
        .eq('match_id', matchId)
        .eq('payload->idempotencyKey', idempotencyKey)
        .eq('action', 'roll_dice')
        .single();

      if (existingRoll) {
        return res.json({ 
          dice: existingRoll.payload.dice,
          legalMoves: existingRoll.payload.legalMoves,
          stateHash: existingRoll.payload.stateHash
        });
      }

      const result = await this.gameEngine.rollDice(matchId, req.user!.id, idempotencyKey);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /ludo/move - Make a move
  async makeMove(req: AuthRequest, res: Response) {
    try {
      const { matchId, moveId, stateHash, idempotencyKey } = req.body;

      // Check idempotency
      const { data: existingMove } = await supabase
        .from('ludo_match_logs')
        .select('*')
        .eq('match_id', matchId)
        .eq('payload->idempotencyKey', idempotencyKey)
        .eq('action', 'move_token')
        .single();

      if (existingMove) {
        return res.json(existingMove.payload.result);
      }

      const result = await this.gameEngine.makeMove(matchId, req.user!.id, moveId, stateHash, idempotencyKey);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /ludo/history - Get match history
  async getMatchHistory(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const { data: matches, error } = await supabase
        .from('ludo_matches')
        .select(`
          id,
          mode,
          entry_fee,
          status,
          winner,
          created_at,
          completed_at,
          ludo_wallet_transactions!inner (
            amount,
            type
          )
        `)
        .eq('user_id', req.user!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const history = matches.map(match => {
        const transactions = match.ludo_wallet_transactions;
        const entryTransaction = transactions.find((t: any) => t.type === 'entry');
        const winTransaction = transactions.find((t: any) => t.type === 'win');
        
        const netTokens = (winTransaction?.amount || 0) - (entryTransaction?.amount || 0);
        
        return {
          id: match.id,
          mode: match.mode,
          entryFee: match.entry_fee,
          status: match.status,
          winner: match.winner,
          netTokens,
          createdAt: match.created_at,
          completedAt: match.completed_at
        };
      });

      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}