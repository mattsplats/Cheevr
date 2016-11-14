'use strict';
module.exports = function(sequelize, DataTypes) {
  var UserQuiz = sequelize.define('UserQuiz', {
    timesAttempted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timesSucceeded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    accuracy: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return UserQuiz;
};