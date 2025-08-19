import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import swaggerUi from 'swagger-ui-express';
import { globalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import walletRoutes from './routes/wallet';
import pokerRoutes from './routes/poker';
import sportsRoutes from './routes/sports';
import cricketRoutes from './routes/cricket';
import { csrfGuard } from './middleware/csrf';
import { config } from './config/config';
import { swaggerSpec } from './docs/swagger';
import { cricketScheduler } from './services/scheduler';

const app = express();

app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin, allowedHeaders: ['content-type','authorization','x-idempotency-key','x-csrf-token'], methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], credentials: true }));
app.use(express.json());
app.use(globalLimiter);
app.use(csrfGuard);

// API Docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/wallet', walletRoutes);
app.use('/poker', pokerRoutes);
app.use('/api', sportsRoutes);
app.use('/api', cricketRoutes);

// Ludo Game Routes
import ludoRoutes from './routes/ludoRoutes';
app.use('/api', ludoRoutes);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Cricket Scheduler Status
app.get('/cricket/status', (_req, res) => {
  const status = cricketScheduler.getStatus();
  res.json({ 
    success: true, 
    scheduler: status,
    config: {
      refreshInterval: config.cricket.refreshInterval,
      enableScheduler: config.cricket.enableScheduler
    }
  });
});

// Start Cricket Scheduler
if (config.cricket.enableScheduler) {
  cricketScheduler.start();
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cricketScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  cricketScheduler.stop();
  process.exit(0);
});

export default app;
