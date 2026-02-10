const { Tag } = require('../models');
exports.list = async (req, res) => {
  const tags = await Tag.findAll({ order: [['name','ASC']] });
  res.json(tags);
};
