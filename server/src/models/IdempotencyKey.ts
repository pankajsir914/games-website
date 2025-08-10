import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize';

interface IdempotencyKeyAttributes {
  id: string;
  userId: string;
  key: string;
  createdAt?: Date;
}

interface IdempotencyKeyCreationAttributes extends Optional<IdempotencyKeyAttributes, 'id' | 'createdAt'> {}

export class IdempotencyKey extends Model<IdempotencyKeyAttributes, IdempotencyKeyCreationAttributes> implements IdempotencyKeyAttributes {
  public id!: string;
  public userId!: string;
  public key!: string;
  public readonly createdAt!: Date;
}

IdempotencyKey.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    key: { type: DataTypes.STRING(100), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'idempotency_keys', updatedAt: false }
);

IdempotencyKey.addIndex({ fields: ['userId', 'key'], unique: true, name: 'uniq_user_key' });
