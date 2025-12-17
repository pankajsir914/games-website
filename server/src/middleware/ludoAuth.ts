import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('ludo_users')
      .select('id, username, status')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Set user context for Supabase RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: user.id,
      is_local: true
    });

    req.user = {
      id: user.id,
      username: user.username
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};