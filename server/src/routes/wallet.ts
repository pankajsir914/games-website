import express from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/rateLimiter';
import { Wallet } from '../models';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ where: { userId: req.user!.id } });
  res.json({ balance: wallet?.balance ?? 0 });
}));

export default router;
