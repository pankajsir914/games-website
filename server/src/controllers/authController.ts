import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

export class AuthController {
  // POST /auth/login
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
}