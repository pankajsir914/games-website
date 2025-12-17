import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize';

export type Role = 'MASTER' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';

interface UserAttributes {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public passwordHash!: string;
  public role!: Role;
  public status!: UserStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(120), allowNull: false },
    role: { type: DataTypes.ENUM('MASTER', 'ADMIN', 'USER'), allowNull: false, defaultValue: 'USER' },
    status: { type: DataTypes.ENUM('ACTIVE', 'BLOCKED', 'SUSPENDED'), allowNull: false, defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'users' }
);
