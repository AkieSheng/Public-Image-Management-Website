const sequelize = require('../config/db');
const User = require('./User');
const Image = require('./Image');
const Tag = require('./Tag');
const ImageTag = require('./ImageTag');

// 关联
User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId' });

Image.belongsToMany(Tag, { through: ImageTag, foreignKey: 'imageId' });
Tag.belongsToMany(Image, { through: ImageTag, foreignKey: 'tagId' });

module.exports = { sequelize, User, Image, Tag, ImageTag };
