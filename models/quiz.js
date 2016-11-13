'use strict';
module.exports = function(sequelize, DataTypes) {
  var Quiz = sequelize.define('Quiz', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    OwnerId: DataTypes.INTEGER,
    timesAttempted: DataTypes.INTEGER,
    timesSucceeded: DataTypes.INTEGER,
    accuracy: DataTypes.FLOAT
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