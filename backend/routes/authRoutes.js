const router = require('express').Router();
const { registerRules, loginRules } = require('../middleware/validators');
const { register, login } = require('../controllers/authController');

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);

module.exports = router;
