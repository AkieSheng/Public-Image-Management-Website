
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Image = sequelize.define('Image', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  originalName: { type: DataTypes.STRING(255), allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: true },
  originalPath: { type: DataTypes.STRING(255), allowNull: false },
  thumbPath: { type: DataTypes.STRING(255), allowNull: false },
  mime: { type: DataTypes.STRING(100), allowNull: true },
  width: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  height: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  resolution: { type: DataTypes.STRING(50), allowNull: true },
  exifTakenAt: { type: DataTypes.DATE, allowNull: true },
  exifLat: { type: DataTypes.FLOAT, allowNull: true },
  exifLng: { type: DataTypes.FLOAT, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'images' });

module.exports = Image;
