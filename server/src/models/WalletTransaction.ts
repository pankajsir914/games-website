import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize';

export type TransactionType = 'credit' | 'debit';

interface WalletTransactionAttributes {
  id: string;
  userId: string; // beneficiary user
  actorId?: string | null; // who performed the action (admin/user)
  amount: number; // integer points
  type: TransactionType;
  reason: string;
  metadata?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WalletTransactionCreationAttributes extends Optional<WalletTransactionAttributes, 'id' | 'actorId' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class WalletTransaction extends Model<WalletTransactionAttributes, WalletTransactionCreationAttributes> implements WalletTransactionAttributes {
  public id!: string;
  public userId!: string;
  public actorId!: string | null;
  public amount!: number;
  public type!: TransactionType;
  public reason!: string;
  public metadata!: object | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WalletTransaction.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: true },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
    reason: { type: DataTypes.STRING(200), allowNull: false },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  { sequelize, tableName: 'wallet_transactions' }
);
