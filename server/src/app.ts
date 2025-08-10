import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import walletRoutes from './routes/wallet';
import pokerRoutes from './routes/poker';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

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
