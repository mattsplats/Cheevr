'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    username: DataTypes.STRING,
    AmazonId: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsToMany(models.Quiz,     {through: models.UserQuiz});
        User.belongsToMany(models.Question, {through: models.UserQuestion});
      }
    }
  });
  return User;
};