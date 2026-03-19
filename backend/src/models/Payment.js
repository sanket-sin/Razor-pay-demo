import { DataTypes } from 'sequelize';

export default function definePayment(sequelize) {
  return sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      provider: { type: DataTypes.ENUM('stripe', 'razorpay'), allowNull: false },
      purpose: { type: DataTypes.ENUM('slot', 'group', 'product'), allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      creatorId: { type: DataTypes.UUID, allowNull: false, field: 'creator_id' },
      amountTotal: { type: DataTypes.BIGINT, allowNull: false, field: 'amount_total' },
      platformFee: { type: DataTypes.BIGINT, allowNull: false, field: 'platform_fee' },
      creatorAmount: { type: DataTypes.BIGINT, allowNull: false, field: 'creator_amount' },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'requires_action',
          'authorized',
          'captured',
          'failed',
          'refunded_partial',
          'refunded_full'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      externalOrderId: { type: DataTypes.STRING(255), field: 'external_order_id' },
      externalPaymentId: { type: DataTypes.STRING(255), field: 'external_payment_id' },
      externalClientSecret: { type: DataTypes.TEXT, field: 'external_client_secret' },
      bookingId: { type: DataTypes.UUID, field: 'booking_id' },
      groupBookingId: { type: DataTypes.UUID, field: 'group_booking_id' },
      orderId: { type: DataTypes.UUID, field: 'order_id' },
      scheduledTransferAt: { type: DataTypes.DATE, field: 'scheduled_transfer_at' },
      transferredAt: { type: DataTypes.DATE, field: 'transferred_at' },
      metadata: { type: DataTypes.JSON },
    },
    { tableName: 'payments' }
  );
}
