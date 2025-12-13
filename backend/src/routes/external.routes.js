const express = require('express');
const router = express.Router();
const externalController = require('../controllers/external.controller');

// GET /api/external/leetcode/:username
router.get('/leetcode/:username', externalController.getLeetcodeProfile);
// GET /api/external/leetcode?username=foo
router.get('/leetcode', externalController.getLeetcodeProfile);

module.exports = router;
