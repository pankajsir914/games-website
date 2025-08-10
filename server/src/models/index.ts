import { User } from './User';
import { Wallet } from './Wallet';
import { Round } from './Round';
import { GameHistory } from './GameHistory';
import { IdempotencyKey } from './IdempotencyKey';
import { sequelize } from './sequelize';
import { WalletTransaction } from './WalletTransaction';

// Associations
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });

GameHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GameHistory, { foreignKey: 'userId', as: 'histories' });

GameHistory.belongsTo(Round, { foreignKey: 'roundId', as: 'round' });
Round.hasMany(GameHistory, { foreignKey: 'roundId', as: 'histories' });

// Wallet transactions
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WalletTransaction.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'transactions' });

export { sequelize, User, Wallet, Round, GameHistory, IdempotencyKey, WalletTransaction };
