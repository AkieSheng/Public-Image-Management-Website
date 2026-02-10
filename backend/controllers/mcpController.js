const { Op } = require('sequelize');
const { Image, Tag } = require('../models');

function parsePrompt(prompt) {
  const p = (prompt || '').trim();

  const tags = Array.from(new Set(
    (p.match(/#([\w\u4e00-\u9fa5]+)/g) || []).map(s => s.slice(1))
  ));

  const dateRange = (() => {
    const m = p.match(/(\d{4}-\d{2}-\d{2})\s*(?:到|-|~|—|–)\s*(\d{4}-\d{2}-\d{2})/);
    if (m) return { from: m[1], to: m[2] };
    const d = p.match(/(\d{4}-\d{2}-\d{2})/);
    if (d) return { on: d[1] };
    return null;
  })();

  // 把标签和日期从关键词里剔除
  const keywords = p
    .replace(/#([^\s]+)/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}\s*(?:到|-|~|—|–)\s*\d{4}-\d{2}-\d{2}/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}/g, ' ')
    .trim();

  return { tags, dateRange, keywords };
}


exports.query = async (req, res) => {
  const { prompt } = req.body;
  const { tags, dateRange, keywords } = parsePrompt(prompt);

  const where = { userId: req.user.id };
  if (keywords) {
    where[Op.or] = [
      { title:        { [Op.like]: `%${keywords}%` } },
      { originalName: { [Op.like]: `%${keywords}%` } },
      { filename:     { [Op.like]: `%${keywords}%` } },
      { note:         { [Op.like]: `%${keywords}%` } },
    ];
  }
  if (dateRange?.on) {
    const d = new Date(dateRange.on);
    const next = new Date(d.getTime() + 24*3600*1000);
    where.exifTakenAt = { [Op.gte]: d, [Op.lt]: next };
  } else if (dateRange?.from && dateRange?.to) {
    const from = new Date(dateRange.from);
    from.setUTCHours(0,0,0,0);

    const to = new Date(dateRange.to);
    to.setUTCHours(0,0,0,0);

    const toNext = new Date(to);
    toNext.setUTCDate(toNext.getUTCDate() + 1);

    where.exifTakenAt = { [Op.gte]: from, [Op.lt]: toNext };
  }

  const include = [{ model: Tag, ...(tags.length ? { where: { name: tags } } : {}) }];
  const rows = await Image.findAll({ where, include, order: [['id','DESC']], limit: 100 });

  res.json({
    thought: { tags, dateRange, keywords },
    results: rows.map(r => ({
      id: r.id,
      title: r.title,
      tags: (r.Tags || []).map(t => t.name),
      takenAt: r.exifTakenAt,
      where: (r.exifLat != null && r.exifLng != null) ? [r.exifLat, r.exifLng] : null,
      resolution: r.resolution,
      thumb: r.thumbPath,
      url: r.originalPath,
    }))
  });
};
