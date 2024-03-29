'use strict';

module.exports = (sequelize, DataTypes) => {
  var log = sequelize.define('log', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.fn("NOW")
    },
    hostip: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    install_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'install',
        key: 'id'
      }
    },
    deleted: {
      type: DataTypes.INTEGER(4),
      allowNull: true,
      defaultValue: null
    }
  }, {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'log'
  });
  log.associate = function(models) {
        models.log.belongsTo(models.install);
          
  }; 
  return log;
};
