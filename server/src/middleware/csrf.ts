import { NextFunction, Request, Response } from 'express';

// Simple header-based CSRF guard for state-changing requests
// If CSRF_TOKEN is set in env, require matching x-csrf-token header
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  const methodsRequiringToken = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!methodsRequiringToken.includes(req.method)) return next();

  const expected = process.env.CSRF_TOKEN;
  if (!expected) return next(); // disabled if not configured

  const provided = req.header('x-csrf-token');
  if (!provided || provided !== expected) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
}
