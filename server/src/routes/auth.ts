import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { signJwt } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authLimiter, asyncHandler } from '../middleware/rateLimiter';

const router = express.Router();

const loginSchema = {
  body: Joi.object({ username: Joi.string().min(3).max(60).required(), password: Joi.string().min(6).max(100).required() }),
};

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if ((user as any).status && (user as any).status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account is not active' });
  }
  const token = signJwt({ id: user.id, role: user.role, username: user.username });
  res.json({ token, user: { id: user.id, role: user.role, username: user.username, status: (user as any).status } });
}));

export default router;
