'use strict';
module.exports = function(sequelize, DataTypes) {
  var Result = sequelize.define('Result', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    timesAttempted: DataTypes.INTEGER,
    timesSucceeded: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Result;
};