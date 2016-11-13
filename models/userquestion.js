'use strict';
module.exports = function(sequelize, DataTypes) {
  var UserQuestion = sequelize.define('UserQuestion', {
    timesAttempted: DataTypes.INTEGER,
    timesSucceeded: DataTypes.INTEGER,
    accuracy: DataTypes.FLOAT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return UserQuestion;
};