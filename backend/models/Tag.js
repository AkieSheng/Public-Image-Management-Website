const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(80), allowNull: false, unique: true }
}, { tableName: 'tags' });

module.exports = Tag;
