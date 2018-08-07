'use strict';

module.exports = (sequelize, DataTypes) => {
  var install = sequelize.define('install', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    product: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    site: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    package_name: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    updater: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    updaterhash: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    updatersig: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    derivative: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    files: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    last_modify: {
      type: DataTypes.DATE,
      allowNull: false
    },
    counter: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    deleted: {
      type: DataTypes.INTEGER(4),
      allowNull: true
    }
  }, {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'install'
  });

  install.associate = function(models) {
        models.install.hasMany(models.log);
          
  };

  return install;
};
