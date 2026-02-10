const { Op } = require('sequelize');
const { Image, Tag } = require('../models');

exports.query = async (req, res) => {
  const { q, dateFrom, dateTo, tags } = req.query;
  const where = { userId: req.user.id };

  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { originalName: { [Op.like]: `%${q}%` } },
      { filename: { [Op.like]: `%${q}%` } },
      { note: { [Op.like]: `%${q}%` } }
    ];
  }
  function dayStart(s){ return new Date(`${s}T00:00:00`); }
  function nextDay(d){ const x = new Date(d); x.setDate(x.getDate()+1); return x; }

  if (dateFrom && dateTo) {
    const start = dayStart(dateFrom);
    const end = nextDay(dayStart(dateTo));
    where.exifTakenAt = { [Op.gte]: start, [Op.lt]: end };
  } else if (dateFrom) {
    where.exifTakenAt = { [Op.gte]: dayStart(dateFrom) };
  } else if (dateTo) {
    const end = nextDay(dayStart(dateTo));
    where.exifTakenAt = { [Op.lt]: end };
  }

  let include = [{ model: Tag }];
  if (tags) {
    const arr = String(tags).split(',').map(s=>s.trim()).filter(Boolean);
    if (arr.length) include = [{ model: Tag, where: { name: arr } }];
  }

  const rows = await Image.findAll({ where, include, order: [['id','DESC']] });
  res.json(rows);
};