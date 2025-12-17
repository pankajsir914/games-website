import { NextFunction, Request, Response } from 'express';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { UniqueConstraintError } from 'sequelize';

export async function idempotencyGuard(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-idempotency-key');
  if (!key) return res.status(400).json({ error: 'Missing x-idempotency-key header' });
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await IdempotencyKey.create({ userId: req.user.id, key });
    return next();
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Duplicate request' });
    }
    return next(err);
  }
}
