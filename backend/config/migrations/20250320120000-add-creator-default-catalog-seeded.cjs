'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('creators', 'default_catalog_seeded', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.sequelize.query(`
      UPDATE creators c
      SET default_catalog_seeded = true
      WHERE EXISTS (SELECT 1 FROM sessions s WHERE s.creator_id = c.id)
         OR EXISTS (SELECT 1 FROM products p WHERE p.creator_id = c.id)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('creators', 'default_catalog_seeded');
  },
};
