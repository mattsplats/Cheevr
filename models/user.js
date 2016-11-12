'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    username: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Quiz);
        User.belongsToMany(models.Question, {through: models.Result});
      }
    }
  });
  return User;
};