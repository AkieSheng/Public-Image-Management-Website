const axios = require('axios');

function toAbsolute(url) {
  if (!url) return url;
  if (/^https?:/i.test(url)) return url;
  const base = process.env.PUBLIC_BASE || 'http://project-backend:5000';
  return url.startsWith('/') ? base + url : `${base}/${url}`;
}

async function remoteTagger(imageUrl) {
  const endpoint = process.env.AI_TAGGER_URL;
  if (!endpoint) throw new Error('AI_TAGGER_URL 未配置');

  const abs = toAbsolute(imageUrl);

  const timeout = Number(process.env.AI_TAGGER_TIMEOUT || 120000);

  const { data } = await axios.post(
    endpoint,
    { imageUrl: abs, backendBase: process.env.PUBLIC_BASE },
    { timeout }
  );

  return (data.tags || []).map(s => String(s).trim()).filter(Boolean);
}

function heuristic(image) {
  const pool = new Set();
  if (image.exifLat != null && image.exifLng != null) pool.add('有地理信息');
  if ((image.width || 0) > 2500) pool.add('高分辨率');
  return Array.from(pool);
}

module.exports = { remoteTagger, heuristic };
