import { DataTypes } from 'sequelize';

export default function defineRefund(sequelize) {
  return sequelize.define(
    'Refund',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      paymentId: { type: DataTypes.UUID, allowNull: false, field: 'payment_id' },
      amount: { type: DataTypes.BIGINT, allowNull: false },
      reason: { type: DataTypes.STRING(500) },
      status: {
        type: DataTypes.ENUM('pending', 'succeeded', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      externalRefundId: { type: DataTypes.STRING(255), field: 'external_refund_id' },
    },
    { tableName: 'refunds' }
  );
}
