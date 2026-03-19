import { DataTypes } from 'sequelize';

export default function defineSlot(sequelize) {
  return sequelize.define(
    'Slot',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: { type: DataTypes.UUID, allowNull: false, field: 'session_id' },
      startUtc: { type: DataTypes.DATE(3), allowNull: false, field: 'start_utc' },
      endUtc: { type: DataTypes.DATE(3), allowNull: false, field: 'end_utc' },
      status: {
        type: DataTypes.ENUM('available', 'locked', 'booked'),
        allowNull: false,
        defaultValue: 'available',
      },
      lockExpiresAt: { type: DataTypes.DATE(3), field: 'lock_expires_at' },
    },
    { tableName: 'slots' }
  );
}
