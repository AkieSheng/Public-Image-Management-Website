const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mcp = require('../controllers/mcpController');

router.post('/query', auth, mcp.query);

module.exports = router;
