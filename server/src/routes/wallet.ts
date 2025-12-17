import express from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/rateLimiter';
import { Wallet, WalletTransaction } from '../models';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ where: { userId: req.user!.id } });
  res.json({ balance: wallet?.balance ?? 0 });
}));
router.get('/transactions', requireAuth, asyncHandler(async (req, res) => {
  const items = await WalletTransaction.findAll({ where: { userId: req.user!.id }, order: [['createdAt', 'DESC']], limit: 50 });
  res.json(items);
}));

export default router;
