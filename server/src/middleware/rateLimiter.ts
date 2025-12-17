import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user?.id || req.ip),
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export function asyncHandler<T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) {
  return (req: T, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}
