const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(100), allowNull: false }
}, { tableName: 'users' });

module.exports = User;
