import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  roundIntervalMs: parseInt(process.env.ROUND_INTERVAL_MS || '10000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  masterAdmin: {
    username: process.env.MASTER_ADMIN_USERNAME || 'master',
    password: process.env.MASTER_ADMIN_PASSWORD || 'master123',
    seedBalance: parseInt(process.env.MASTER_ADMIN_SEED_BALANCE || '1000000', 10),
  },
};
