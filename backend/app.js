const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now()-t0}ms`);
  });
  next();
});
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 上传目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/mcp', require('./routes/mcpRoutes'));

// 检查状态
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend on :${PORT}`));