import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize';

interface GameHistoryAttributes {
  id: string;
  userId: string;
  roundId: string;
  bet: number; // points bet
  payout?: number | null; // points won (not net), computed at settlement
  result: 'PENDING' | 'WON' | 'LOST';
  pointsBefore: number;
  pointsAfter: number; // after settlement
  createdAt?: Date;
  updatedAt?: Date;
}

interface GameHistoryCreationAttributes extends Optional<GameHistoryAttributes, 'id' | 'payout' | 'result' | 'pointsAfter' | 'createdAt' | 'updatedAt'> {}

export class GameHistory extends Model<GameHistoryAttributes, GameHistoryCreationAttributes> implements GameHistoryAttributes {
  public id!: string;
  public userId!: string;
  public roundId!: string;
  public bet!: number;
  public payout!: number | null;
  public result!: 'PENDING' | 'WON' | 'LOST';
  public pointsBefore!: number;
  public pointsAfter!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GameHistory.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    roundId: { type: DataTypes.UUID, allowNull: false },
    bet: { type: DataTypes.INTEGER, allowNull: false },
    payout: { type: DataTypes.INTEGER, allowNull: true },
    result: { type: DataTypes.ENUM('PENDING', 'WON', 'LOST'), allowNull: false, defaultValue: 'PENDING' },
    pointsBefore: { type: DataTypes.INTEGER, allowNull: false },
    pointsAfter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'game_histories' }
);
