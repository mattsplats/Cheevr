'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    q: DataTypes.STRING,
    a: DataTypes.BOOLEAN,
    timesAttempted: DataTypes.INTEGER,
    timesSucceeded: DataTypes.INTEGER,
    accuracy: DataTypes.FLOAT
  }, {
    classMethods: {
      associate: function(models) {
        Question.belongsToMany(models.User, {through: models.Result});
      }
    }
  });
  return Question;
};