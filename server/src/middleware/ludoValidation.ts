import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const schemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(100).required()
  }),
  
  createMatch: Joi.object({
    mode: Joi.string().valid('2p', '4p').required(),
    entryFee: Joi.number().integer().min(100).max(50000).required(),
    botDifficulty: Joi.string().valid('easy', 'normal', 'pro').default('normal')
  }),
  
  rollDice: Joi.object({
    matchId: Joi.string().uuid().required(),
    idempotencyKey: Joi.string().min(10).max(100).required()
  }),
  
  makeMove: Joi.object({
    matchId: Joi.string().uuid().required(),
    moveId: Joi.string().required(),
    stateHash: Joi.string().required(),
    idempotencyKey: Joi.string().min(10).max(100).required()
  })
};

export const validateLudoRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails
      });
    }
    
    req.body = value;
    next();
  };
};