import { DataTypes } from 'sequelize';

export default function defineGroupSession(sequelize) {
  return sequelize.define(
    'GroupSession',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creatorId: { type: DataTypes.UUID, allowNull: false, field: 'creator_id' },
      title: { type: DataTypes.STRING(500), allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
      endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
      sessionTz: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC', field: 'session_tz' },
      dailyStartMinute: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'daily_start_minute' },
      dailyEndMinute: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'daily_end_minute' },
      maxParticipants: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'max_participants' },
      priceAmount: { type: DataTypes.BIGINT, allowNull: false, field: 'price_amount' },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'usd' },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    { tableName: 'group_sessions' }
  );
}
