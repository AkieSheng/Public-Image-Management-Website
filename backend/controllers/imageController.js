const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Image, Tag } = require('../models');
const { readExif } = require('../utils/exif');

const thumbsDir = path.join(__dirname, '..', 'uploads', 'thumbs');

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: '未选择文件' });
  try {
    const abs = req.file.path;
    const img = sharp(abs);
    const meta = await img.metadata();
    const thumbName = `thumb_${req.file.filename}`;
    const thumbAbs = path.join(thumbsDir, thumbName);

    // 生成缩略图
    const maxSide = 512;
    const width = meta.width || 0;
    const height = meta.height || 0;
    const landscape = width >= height;
    await img.resize(landscape ? maxSide : null, landscape ? null : maxSide, { fit: 'inside' }).toFile(thumbAbs);

    const { takenAt, lat, lng } = await readExif(abs);
    // EXIF 没记录时间的话用上传时间补齐
    const uploadTime = new Date();
    const takenAtFinal = takenAt ? new Date(takenAt) : uploadTime;

    // 标题与初始标签
    const title = (req.body.title || '').trim() || null;
    let incomingTags = [];
    if (req.body.tags) {
      try { incomingTags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags); }
      catch { incomingTags = String(req.body.tags).split(','); }
    }
    const tagNames = Array.from(new Set((incomingTags || []).map(t => String(t || '').trim()).filter(Boolean)));

    const record = await Image.create({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      title,
      originalPath: `/uploads/originals/${req.file.filename}`,
      thumbPath: `/uploads/thumbs/${thumbName}`,
      mime: req.file.mimetype,
      width, height,
      exifTakenAt: takenAtFinal,
      exifLat: lat,
      exifLng: lng,
      resolution: width && height ? `${width}x${height}` : null
    });

    if (tagNames.length) {
      const tagModels = [];
      for (const name of tagNames) {
        const [model] = await Tag.findOrCreate({ where: { name } });
        tagModels.push(model);
      }
      await record.setTags(tagModels);
    }

    const withTags = await Image.findByPk(record.id, { include: Tag });
    res.json(withTags);
  } catch (e) {
    console.error('upload failed:', e);
    res.status(500).json({ message: '上传失败' });
  }
};

exports.addTags = async (req, res) => {
  try {
    const { imageId, tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: 'tags 应为数组' });
    }

    const image = await Image.findOne({ where: { id: imageId, userId: req.user.id } });
    if (!image) return res.status(404).json({ message: '图片不存在' });

    const names = Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)));

    const tagModels = [];
    for (const name of names) {
      const [model] = await Tag.findOrCreate({ where: { name } });
      tagModels.push(model);
    }

    const uniqueModels = [...new Map(tagModels.map(m => [m.id, m])).values()];
    await image.setTags(uniqueModels);

    const withTags = await Image.findByPk(image.id, { include: Tag });
    return res.json(withTags);
  } catch (e) {
    console.error('addTags failed:', e);
    return res.status(500).json({ message: '添加标签失败', error: String(e) });
  }
};

exports.list = async (req, res) => {
  const images = await Image.findAll({ where: { userId: req.user.id }, order: [['id', 'DESC']], include: Tag });
  res.json(images);
};

exports.getOne = async (req, res) => {
  const img = await Image.findOne({ where: { id: req.params.id, userId: req.user.id }, include: Tag });
  if (!img) return res.status(404).json({ message: '未找到' });
  res.json(img);
};

exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    let { crop, brightness, saturation, contrast } = req.body;

    const image = await Image.findOne({ where: { id, userId: req.user.id } });
    if (!image) return res.status(404).json({ message: '未找到' });

    const abs = path.join(__dirname, '..', image.originalPath.replace(/^\//, ''));
    const thumbAbs = path.join(__dirname, '..', image.thumbPath.replace(/^\//, ''));

    if (!fs.existsSync(abs)) return res.status(404).json({ message: '原图文件不存在' });

    brightness = brightness ? Number(brightness) : 1;
    saturation = saturation ? Number(saturation) : 1;
    contrast = contrast ? Number(contrast) : 1;

    let pipeline = sharp(abs);
    const meta = await pipeline.metadata();

    if (crop && crop.width && crop.height) {
      const left = Math.max(0, Math.floor(Number(crop.left) || 0));
      const top = Math.max(0, Math.floor(Number(crop.top) || 0));
      const w = Math.floor(Number(crop.width));
      const h = Math.floor(Number(crop.height));
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        return res.status(400).json({ message: '裁剪尺寸非法' });
      }
      if (left + w > meta.width || top + h > meta.height) {
        return res.status(400).json({ message: '裁剪尺寸越界' });
      }
      pipeline = pipeline.extract({ left, top, width: w, height: h });
    }

    if (brightness !== 1 || saturation !== 1) {
      pipeline = pipeline.modulate({ brightness, saturation });
    }
    if (contrast !== 1) {
      const c = contrast;
      pipeline = pipeline.linear(c, -(128 * c) + 128);
    }

    const tmpAbs = abs + '.tmp';
    await pipeline.toFile(tmpAbs);
    fs.renameSync(tmpAbs, abs);

    await sharp(abs).resize(512, 512, { fit: 'inside' }).toFile(thumbAbs);

    return res.json({ message: '编辑完成' });
  } catch (e) {
    console.error('edit failed:', e);
    return res.status(500).json({ message: '编辑失败', error: String(e) });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const image = await Image.findOne({ where: { id, userId: req.user.id } });
  if (!image) return res.status(404).json({ message: '未找到' });

  try { fs.unlinkSync(path.join(__dirname, '..', image.originalPath.replace(/^\//, ''))); } catch {}
  try { fs.unlinkSync(path.join(__dirname, '..', image.thumbPath.replace(/^\//, ''))); } catch {}

  await image.destroy();
  res.json({ message: '已删除' });
};

// 更新标题
exports.updateMeta = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const image = await Image.findOne({ where: { id, userId: req.user.id } });
  if (!image) return res.status(404).json({ message: '未找到' });
  image.title = (title || '').trim() || null;
  await image.save();
  res.json({ message: '已更新', title: image.title });
};

// AI 打标
exports.aiTag = async (req, res) => {
  const { id } = req.params;
  const image = await Image.findOne({ where: { id, userId: req.user.id }, include: Tag });
  if (!image) return res.status(404).json({ message: '未找到' });

  const { remoteTagger, heuristic } = require('../services/aiTagger');
  let tags = [];
  try {
    // 优先用缩略图打标
    tags = await remoteTagger(image.thumbPath || image.originalPath);
  } catch (e) {
    console.warn('AI remote failed, fallback heuristic:', e?.message);
    tags = heuristic(image);
  }

  if (!tags.length) return res.json({ message: '无可用标签' });

  const tagModels = [];
  for (const name of Array.from(new Set(tags))) {
    const [model] = await Tag.findOrCreate({ where: { name } });
    tagModels.push(model);
  }
  await image.addTags(tagModels);

  const refetched = await Image.findByPk(image.id, { include: Tag });
  res.json({ message: 'AI 打标完成', image: refetched });
};

exports.addTagsAppend = async (req, res) => {
  try {
    const { imageId, tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags 应为数组' });

    const image = await Image.findOne({ where: { id: imageId, userId: req.user.id }, include: Tag });
    if (!image) return res.status(404).json({ message: '图片不存在' });

    const names = Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)));
    if (!names.length) return res.json(image);

    const tagModels = [];
    for (const name of names) {
      const [model] = await Tag.findOrCreate({ where: { name } });
      tagModels.push(model);
    }

    await image.addTags(tagModels);

    const withTags = await Image.findByPk(image.id, { include: Tag });
    return res.json(withTags);
  } catch (e) {
    console.error('addTagsAppend failed:', e);
    return res.status(500).json({ message: '追加标签失败', error: String(e) });
  }
};
