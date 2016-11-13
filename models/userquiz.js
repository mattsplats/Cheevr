'use strict';
module.exports = function(sequelize, DataTypes) {
  var UserQuiz = sequelize.define('UserQuiz', {
    timesAttempted: DataTypes.INTEGER,
    timesSucceeded: DataTypes.FLOAT,
    accuracy: DataTypes.FLOAT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return UserQuiz;
};