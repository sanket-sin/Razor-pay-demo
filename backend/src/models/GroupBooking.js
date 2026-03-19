import { DataTypes } from 'sequelize';

export default function defineGroupBooking(sequelize) {
  return sequelize.define(
    'GroupBooking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      groupSessionId: { type: DataTypes.UUID, allowNull: false, field: 'group_session_id' },
      paymentId: { type: DataTypes.UUID, field: 'payment_id' },
      status: {
        type: DataTypes.ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    {
      tableName: 'group_bookings',
      indexes: [{ unique: true, fields: ['user_id', 'group_session_id'] }],
    }
  );
}
