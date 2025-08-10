import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { signJwt } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authLimiter, asyncHandler } from '../middleware/rateLimiter';

const router = express.Router();

const loginSchema = z.object({
  body: z.object({ username: z.string().min(3).max(60), password: z.string().min(6).max(100) }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signJwt({ id: user.id, role: user.role, username: user.username });
  res.json({ token, user: { id: user.id, role: user.role, username: user.username } });
}));

export default router;
