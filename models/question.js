'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    q: DataTypes.STRING,
    a: DataTypes.STRING,
    choiceA: DataTypes.STRING,
    choiceB: DataTypes.STRING,
    choiceC: DataTypes.STRING,
    choiceD: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Question.belongsToMany(models.User, {through: models.UserQuestion});
      }
    }
  });
  return Question;
};