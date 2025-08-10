import { User } from './User';
import { Wallet } from './Wallet';
import { Round } from './Round';
import { GameHistory } from './GameHistory';
import { IdempotencyKey } from './IdempotencyKey';
import { sequelize } from './sequelize';

// Associations
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });

GameHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GameHistory, { foreignKey: 'userId', as: 'histories' });

GameHistory.belongsTo(Round, { foreignKey: 'roundId', as: 'round' });
Round.hasMany(GameHistory, { foreignKey: 'roundId', as: 'histories' });

export { sequelize, User, Wallet, Round, GameHistory, IdempotencyKey };
