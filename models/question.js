'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    q: DataTypes.STRING,
    a: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Question.belongsToMany(models.User, {through: models.Result});
      }
    }
  });
  return Question;
};