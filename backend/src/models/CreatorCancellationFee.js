import { DataTypes } from 'sequelize';

export default function defineCreatorCancellationFee(sequelize) {
  return sequelize.define(
    'CreatorCancellationFee',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creatorId: { type: DataTypes.UUID, allowNull: false, field: 'creator_id' },
      amountMinor: { type: DataTypes.BIGINT, allowNull: false, field: 'amount_minor' },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      sourcePaymentId: { type: DataTypes.UUID, allowNull: false, field: 'source_payment_id' },
      deductedAt: { type: DataTypes.DATE(3), field: 'deducted_at' },
    },
    { tableName: 'creator_cancellation_fees', underscored: true }
  );
}
