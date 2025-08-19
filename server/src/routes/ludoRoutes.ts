import { Router } from 'express';
import { LudoController } from '../controllers/ludoController';
import { authenticateUser } from '../middleware/ludoAuth';
import { validateLudoRequest } from '../middleware/ludoValidation';
import rateLimit from 'express-rate-limit';

const router = Router();
const ludoController = new LudoController();

// Rate limiting
const gameRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // max 5 requests per second per user
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 requests per minute
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication routes
router.post('/auth/login', authRateLimit, validateLudoRequest('login'), ludoController.login);

// Protected routes
router.use(authenticateUser);

// Wallet routes
router.get('/wallet', ludoController.getWallet.bind(ludoController));

// Game routes
router.post('/ludo/create', gameRateLimit, validateLudoRequest('createMatch'), ludoController.createMatch.bind(ludoController));
router.get('/ludo/state/:matchId', ludoController.getMatchState.bind(ludoController));
router.post('/ludo/roll', gameRateLimit, validateLudoRequest('rollDice'), ludoController.rollDice.bind(ludoController));
router.post('/ludo/move', gameRateLimit, validateLudoRequest('makeMove'), ludoController.makeMove.bind(ludoController));
router.get('/ludo/history', ludoController.getMatchHistory.bind(ludoController));

export default router;