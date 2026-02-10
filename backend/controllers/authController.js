const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  const { username, email, password } = req.body;
  try {
    const exists = await User.findOne({ where: { email } }) ||
                   await User.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: '用户名或邮箱已存在' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    res.json({ id: user.id, username, email });
  } catch (e) { res.status(500).json({ message: '注册失败' }); }
};

exports.login = async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: '邮箱或密码错误' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: '邮箱或密码错误' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch { res.status(500).json({ message: '登录失败' }); }
};
