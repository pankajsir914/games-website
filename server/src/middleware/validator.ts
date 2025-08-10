import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';

export function validate(schema: { body?: ObjectSchema; params?: ObjectSchema; query?: ObjectSchema }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const bodySchema = schema.body || Joi.object({});
    const paramsSchema = schema.params || Joi.object({});
    const querySchema = schema.query || Joi.object({});

    const { value: body, error: bodyErr } = bodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    const { value: params, error: paramsErr } = paramsSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
    const { value: query, error: queryErr } = querySchema.validate(req.query, { abortEarly: false, stripUnknown: true });

    if (bodyErr || paramsErr || queryErr) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          body: bodyErr?.details,
          params: paramsErr?.details,
          query: queryErr?.details,
        },
      });
    }

    req.body = body;
    req.params = params as any;
    req.query = query as any;
    next();
  };
}
