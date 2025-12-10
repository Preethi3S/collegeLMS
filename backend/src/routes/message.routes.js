const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { auth } = require('../middleware/auth.middleware');

// Send a message
router.post('/', auth, messageController.sendMessage);

// Send bulk message (to year, dept, etc)
router.post('/send-bulk', auth, messageController.sendBulkMessage);

// Inbox
router.get('/inbox', auth, messageController.getInbox);

// Sent
router.get('/sent', auth, messageController.getSent);

// Unread count
router.get('/unread-count', auth, messageController.getUnreadCount);

// Mark read
router.post('/:id/read', auth, messageController.markAsRead);

module.exports = router;
