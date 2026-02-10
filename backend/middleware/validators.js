const { body, query } = require('express-validator');

const registerRules = [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3字符'),
  body('email').isEmail().withMessage('Email格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6字符')
];

const loginRules = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];

const searchRules = [
  query('q').optional().isString(),
  query('tags').optional().isString(), // 逗号分隔
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('minW').optional().isInt({ min: 1 }),
  query('minH').optional().isInt({ min: 1 })
];

module.exports = { registerRules, loginRules, searchRules };
