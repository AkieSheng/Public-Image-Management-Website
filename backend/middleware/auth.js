const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: '未授权' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: '令牌无效' });
  }
}
