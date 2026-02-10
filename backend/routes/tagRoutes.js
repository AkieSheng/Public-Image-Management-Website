const router = require('express').Router();
const auth = require('../middleware/auth');
const { list } = require('../controllers/tagController');

router.use(auth);
router.get('/', list);

module.exports = router;
