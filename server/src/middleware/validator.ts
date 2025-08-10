import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate<T extends ZodSchema<any>>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    }
    // Assign parsed values back (optional)
    req.body = result.data.body;
    req.params = result.data.params as any;
    req.query = result.data.query as any;
    next();
  };
}
