'use strict';
module.exports = function(sequelize, DataTypes) {
  var Quiz = sequelize.define('Quiz', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    OwnerId: DataTypes.INTEGER,
    numberToAsk: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
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
        Quiz.hasMany(models.Question);
        Quiz.belongsToMany(models.User, {through: models.UserQuiz});
      }
    }
  });
  return Quiz;
};