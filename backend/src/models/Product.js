import { DataTypes } from 'sequelize';

export default function defineProduct(sequelize) {
  return sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creatorId: { type: DataTypes.UUID, allowNull: false, field: 'creator_id' },
      name: { type: DataTypes.STRING(500), allowNull: false },
      description: { type: DataTypes.TEXT },
      priceAmount: { type: DataTypes.BIGINT, allowNull: false, field: 'price_amount' },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'usd' },
      stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      deliveryRegions: { type: DataTypes.JSON, allowNull: false, field: 'delivery_regions' },
      imageUrl: { type: DataTypes.STRING(2048), field: 'image_url' },
    },
    { tableName: 'products' }
  );
}
