const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { auth } = require('../middleware/auth.middleware');

// Send a message
router.post('/', auth, messageController.sendMessage);

// Inbox
router.get('/inbox', auth, messageController.getInbox);

// Sent
router.get('/sent', auth, messageController.getSent);

// Mark read
router.post('/:id/read', auth, messageController.markAsRead);

module.exports = router;
