import { DataTypes } from 'sequelize';

export default function defineUser(sequelize) {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
      role: { type: DataTypes.ENUM('creator', 'buyer'), allowNull: false, defaultValue: 'buyer' },
      name: { type: DataTypes.STRING(255), allowNull: false },
      razorpayCustomerId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'razorpay_customer_id',
      },
    },
    { tableName: 'users' }
  );
}
