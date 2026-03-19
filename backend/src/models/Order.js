import { DataTypes } from 'sequelize';

export default function defineOrder(sequelize) {
  return sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      status: {
        type: DataTypes.ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      shippingAddress: { type: DataTypes.JSON, field: 'shipping_address' },
      paymentId: { type: DataTypes.UUID, field: 'payment_id' },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    { tableName: 'orders' }
  );
}
