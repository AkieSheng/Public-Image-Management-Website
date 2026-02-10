const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ImageTag = sequelize.define('ImageTag', {
  imageId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
  tagId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true }
}, { tableName: 'image_tags', timestamps: false });

module.exports = ImageTag;
