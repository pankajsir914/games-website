import http from 'http';
import app from './app';
import { config } from './config/config';
import { initPokerEngine } from './services/pokerEngine';
import { sequelize, User, Wallet } from './models';
import bcrypt from 'bcrypt';

async function ensureMasterAdmin() {
  const username = config.masterAdmin.username;
  const password = config.masterAdmin.password;
  const seedBalance = config.masterAdmin.seedBalance;

  let user = await User.findOne({ where: { username } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({ username, passwordHash, role: 'MASTER' });
    await Wallet.create({ userId: user.id, balance: seedBalance });
    console.log(`Created master admin '${username}' with seed balance ${seedBalance}`);
  } else {
    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    if (!wallet) await Wallet.create({ userId: user.id, balance: seedBalance });
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureMasterAdmin();

    const server = http.createServer(app);
    initPokerEngine(server);

    server.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

bootstrap();
