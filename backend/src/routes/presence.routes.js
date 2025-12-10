const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presence.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/heartbeat', auth, presenceController.heartbeat);
router.get('/', auth, presenceController.getPresence);

module.exports = router;
