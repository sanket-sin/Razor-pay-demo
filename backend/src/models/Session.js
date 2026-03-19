import { DataTypes } from 'sequelize';

export default function defineSession(sequelize) {
  return sequelize.define(
    'Session',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creatorId: { type: DataTypes.UUID, allowNull: false, field: 'creator_id' },
      title: { type: DataTypes.STRING(500), allowNull: false },
      sessionDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'session_date' },
      sessionTz: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC', field: 'session_tz' },
      windowStartMinute: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'window_start_minute' },
      windowEndMinute: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'window_end_minute' },
      slotDurationMinutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'slot_duration_minutes' },
      priceAmount: { type: DataTypes.BIGINT, allowNull: false, field: 'price_amount' },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'usd' },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    { tableName: 'sessions' }
  );
}
