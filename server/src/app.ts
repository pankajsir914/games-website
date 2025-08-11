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
import { csrfGuard } from './middleware/csrf';
import { config } from './config/config';
import { swaggerSpec } from './docs/swagger';

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

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
