const exifr = require('exifr');

async function readExif(absPath) {
  try {
    const data = await exifr.parse(absPath, { gps: true });
    if (!data) return {};

    const takenAt =
      data.DateTimeOriginal ||
      data.CreateDate ||
      data.ModifyDate ||
      null;

    const lat = data.latitude ?? null;
    const lng = data.longitude ?? null;
    return { takenAt, lat, lng };
  } catch {
    return {};
  }
}

module.exports = { readExif };
