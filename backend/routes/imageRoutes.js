const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imageController = require('../controllers/imageController');

// 上传目录
const uploadRoot = path.join(__dirname, '..', 'uploads');
const originals = path.join(uploadRoot, 'originals');
const thumbs = path.join(uploadRoot, 'thumbs');
for (const p of [uploadRoot, originals, thumbs]) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

// Multer 存储规则
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, originals),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random()*1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.get('/', auth, imageController.list);
router.get('/:id', auth, imageController.getOne);
router.post('/upload', auth, upload.single('image'), imageController.upload);
router.post('/:id/edit', auth, imageController.edit);
router.delete('/:id', auth, imageController.remove);

// 更新标题
router.put('/:id/meta', auth, imageController.updateMeta);

// AI 打标
router.post('/:id/ai-tags', auth, imageController.aiTag);

// 标签添加/删除
router.post('/tags', auth, imageController.addTags);
router.post('/tags/append', auth, imageController.addTagsAppend);

module.exports = router;