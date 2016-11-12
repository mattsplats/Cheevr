'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('MultipleChoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      question: {
        type: Sequelize.STRING
      },
      choiceA: {
        type: Sequelize.STRING
      },
      choiceB: {
        type: Sequelize.STRING
      },
      choiceC: {
        type: Sequelize.STRING
      },
      choiceD: {
        type: Sequelize.STRING
      },
      answer: {
        type: Sequelize.BOOLEAN
      },
      timesTaken: {
        type: Sequelize.INTEGER
      },
      timesAttempted: {
        type: Sequelize.INTEGER
      },
      accuracy: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('MultipleChoices');
  }
};