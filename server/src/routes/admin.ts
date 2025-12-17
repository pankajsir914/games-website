import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { asyncHandler } from '../middleware/rateLimiter';
import { idempotencyGuard } from '../middleware/idempotency';
import { sequelize, User, Wallet, WalletTransaction } from '../models';

const router = express.Router();

const createUserSchema = {
  body: Joi.object({
    username: Joi.string().min(3).max(60).required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('ADMIN', 'USER').default('USER'),
    initialPoints: Joi.number().integer().min(0).default(0),
  }),
};

router.post('/create-user', requireAuth, requireRole('MASTER', 'ADMIN'), idempotencyGuard, validate(createUserSchema), asyncHandler(async (req, res) => {
  const { username, password, role, initialPoints } = req.body as { username: string; password: string; role: 'ADMIN'|'USER'; initialPoints: number };
  const creator = req.user!;

  if (creator.role === 'ADMIN' && role !== 'USER') {
    return res.status(403).json({ error: 'Admins can only create users' });
  }

  // Check if user already exists
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await sequelize.transaction(async (t) => {
    const user = await User.create({ username, passwordHash: hash, role: role === 'ADMIN' ? 'ADMIN' : 'USER' }, { transaction: t });
    const wallet = await Wallet.create({ userId: user.id, balance: 0 }, { transaction: t });

    if (initialPoints > 0) {
      // Deduct from creator wallet if creator is not MASTER? Requirement: Master assigns from their balance too.
      const creatorWallet = await Wallet.findOne({ where: { userId: creator.id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!creatorWallet || creatorWallet.balance < initialPoints) {
        throw new Error('Insufficient balance to assign initial points');
      }
      creatorWallet.balance -= initialPoints;
      await creatorWallet.save({ transaction: t });

      wallet.balance += initialPoints;
      await wallet.save({ transaction: t });

      // Log transactions
      await WalletTransaction.create({
        userId: creator.id,
        actorId: creator.id,
        amount: initialPoints,
        type: 'debit',
        reason: `Initial points assigned to ${username}`,
      }, { transaction: t });

      await WalletTransaction.create({
        userId: user.id,
        actorId: creator.id,
        amount: initialPoints,
        type: 'credit',
        reason: `Initial points received from ${creator.username}`,
      }, { transaction: t });
    }

    return { id: user.id, username: user.username, role: user.role };
  });

  res.status(201).json(result);
}));

const assignSchema = { body: Joi.object({ targetUserId: Joi.string().uuid().required(), amount: Joi.number().integer().positive().required() }) };

router.post('/assign-points', requireAuth, requireRole('MASTER', 'ADMIN'), idempotencyGuard, validate(assignSchema), asyncHandler(async (req, res) => {
  const { targetUserId, amount } = req.body as { targetUserId: string; amount: number };
  const actorId = req.user!.id;
  const result = await sequelize.transaction(async (t) => {
    const actorWallet = await Wallet.findOne({ where: { userId: actorId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!actorWallet || actorWallet.balance < amount) throw new Error('Insufficient balance');

    const targetWallet = await Wallet.findOne({ where: { userId: targetUserId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!targetWallet) throw new Error('Target wallet not found');

    actorWallet.balance -= amount;
    targetWallet.balance += amount;

    await actorWallet.save({ transaction: t });
    await targetWallet.save({ transaction: t });

    // Log transactions
    await WalletTransaction.create({
      userId: actorId,
      actorId: actorId,
      amount,
      type: 'debit',
      reason: `Points assigned to user ${targetUserId}`,
    }, { transaction: t });

    await WalletTransaction.create({
      userId: targetUserId,
      actorId: actorId,
      amount,
      type: 'credit',
      reason: `Points received from admin ${actorId}`,
    }, { transaction: t });

    return { fromBalance: actorWallet.balance, toBalance: targetWallet.balance };
  });

  res.json(result);
}));

// Admin dashboard stats
router.get('/stats', requireAuth, requireRole('MASTER', 'ADMIN'), asyncHandler(async (_req, res) => {
  const [totalUsers, totalAdmins, totalPoints, transactions] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'ADMIN' } }),
    Wallet.sum('balance'),
    WalletTransaction.count(),
  ]);
  res.json({ totalUsers, totalAdmins, totalPoints: Number(totalPoints || 0), transactions });
}));

// Block/Unblock/Suspend user
const userStatusSchema = {
  body: Joi.object({
    userId: Joi.string().uuid().required(),
    action: Joi.string().valid('block', 'unblock', 'suspend').required(),
    reason: Joi.string().max(200).allow('', null),
  }),
};

router.post('/user-status', requireAuth, requireRole('MASTER', 'ADMIN'), idempotencyGuard, validate(userStatusSchema), asyncHandler(async (req, res) => {
  const { userId, action } = req.body as { userId: string; action: 'block'|'unblock'|'suspend'; reason?: string };
  const actor = req.user!;
  const target = await User.findByPk(userId);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (actor.role === 'ADMIN' && target.role !== 'USER') {
    return res.status(403).json({ error: 'Admins can only modify users' });
  }
  const statusMap: any = { block: 'BLOCKED', unblock: 'ACTIVE', suspend: 'SUSPENDED' };
  await target.update({ status: statusMap[action] });
  res.json({ success: true, userId, status: statusMap[action] });
}));

export default router;
