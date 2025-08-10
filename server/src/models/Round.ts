import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize';

interface RoundAttributes {
  id: string;
  sequence: number;
  status: 'PENDING' | 'SETTLED';
  startedAt: Date;
  endedAt?: Date | null;
  cards: string; // comma-separated like "As,Kd,Th,7c,2s"
  handName?: string | null;
  payoutMultiplier?: number | null; // e.g., 0, 1.5, 2, ...
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoundCreationAttributes extends Optional<RoundAttributes, 'id' | 'sequence' | 'status' | 'endedAt' | 'cards' | 'handName' | 'payoutMultiplier' | 'createdAt' | 'updatedAt'> {}

export class Round extends Model<RoundAttributes, RoundCreationAttributes> implements RoundAttributes {
  public id!: string;
  public sequence!: number;
  public status!: 'PENDING' | 'SETTLED';
  public startedAt!: Date;
  public endedAt!: Date | null;
  public cards!: string;
  public handName!: string | null;
  public payoutMultiplier!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Round.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sequence: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('PENDING', 'SETTLED'), allowNull: false, defaultValue: 'PENDING' },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    cards: { type: DataTypes.STRING(64), allowNull: false, defaultValue: '' },
    handName: { type: DataTypes.STRING(32), allowNull: true },
    payoutMultiplier: { type: DataTypes.FLOAT, allowNull: true },
  },
  { sequelize, tableName: 'rounds' }
);
