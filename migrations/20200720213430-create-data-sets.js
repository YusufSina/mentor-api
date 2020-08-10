'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'data_sets',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        key_title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.STRING,
          allowNull: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        deleted_at: {
          type: Sequelize.DATE
        }
      }
    );
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('data_sets');
  }
};