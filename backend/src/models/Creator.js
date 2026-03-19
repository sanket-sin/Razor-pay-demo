import { DataTypes } from 'sequelize';

export default function defineCreator(sequelize) {
  return sequelize.define(
    'Creator',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'user_id' },
      displayName: { type: DataTypes.STRING(255), allowNull: false, field: 'display_name' },
      bio: { type: DataTypes.TEXT },
      stripeConnectAccountId: { type: DataTypes.STRING(255), field: 'stripe_connect_account_id' },
      razorpayLinkedAccountId: { type: DataTypes.STRING(255), field: 'razorpay_linked_account_id' },
    },
    { tableName: 'creators' }
  );
}
