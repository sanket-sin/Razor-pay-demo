import { DataTypes } from 'sequelize';

export default function defineBooking(sequelize) {
  return sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      slotId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'slot_id' },
      paymentId: { type: DataTypes.UUID, field: 'payment_id' },
      status: {
        type: DataTypes.ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    { tableName: 'bookings' }
  );
}
