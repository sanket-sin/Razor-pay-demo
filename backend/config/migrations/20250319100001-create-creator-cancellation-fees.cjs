'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('creator_cancellation_fees', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'creators', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      amount_minor: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false },
      source_payment_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      deducted_at: { type: Sequelize.DATE(3) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('creator_cancellation_fees');
  },
};
