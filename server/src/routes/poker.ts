import express from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { asyncHandler } from '../middleware/rateLimiter';
import { idempotencyGuard } from '../middleware/idempotency';
import { GameHistory, Round, Wallet, sequelize, WalletTransaction } from '../models';
import { getCurrentRound } from '../services/pokerEngine';

const router = express.Router();

const betSchema = { body: Joi.object({ amount: Joi.number().integer().positive().required(), bet_type: Joi.string().default('standard') }) };

router.post('/place-bet', requireAuth, idempotencyGuard, validate(betSchema), asyncHandler(async (req, res) => {
  const { amount, bet_type } = req.body as { amount: number; bet_type: string };
  const round = getCurrentRound();
  if (!round) return res.status(400).json({ error: 'No active round right now' });

  const result = await sequelize.transaction(async (t) => {
    const wallet = await Wallet.findOne({ where: { userId: req.user!.id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet || wallet.balance < amount) throw new Error('Insufficient balance');

    const pointsBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save({ transaction: t });

    // Log wallet transaction (bet debit)
    await WalletTransaction.create({
      userId: req.user!.id,
      actorId: req.user!.id,
      amount,
      type: 'debit',
      reason: `Poker bet - Round ${round.sequence}`,
    }, { transaction: t });

    const history = await GameHistory.create({
      userId: req.user!.id,
      roundId: round.id,
      bet: amount,
      payout: null,
      result: 'PENDING',
      pointsBefore,
      pointsAfter: wallet.balance, // after bet deduction; will be updated on settlement
    }, { transaction: t });

    return { historyId: history.id, roundId: round.id, balance: wallet.balance };
  });

  res.status(201).json(result);
}));

router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  const items = await GameHistory.findAll({ where: { userId: req.user!.id }, order: [['createdAt', 'DESC']], limit: 50 });
  res.json(items);
}));

export default router;
