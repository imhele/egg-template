'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING } = Sequelize;
    await queryInterface.createTable('Secret', {
      accountId: {
        type: STRING(18),
        allowNull: false,
      },
      secret: {
        type: STRING(22),
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('Secret', ['accountId'], {
      type: 'primary key',
      name: 'PrimaryKey',
    });
    // await queryInterface.addIndex('Secret', { name: 'accountIdIndex', fields: ['accountId'] });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('Secret');
  },
};
