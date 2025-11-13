const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Login (any user)
router.post('/login', authController.login);

// Admin creates a student
router.post('/create-student', auth, adminOnly, authController.createStudent);

// Admin bulk upload via Excel (field name: file)
router.post('/bulk-upload', auth, adminOnly, upload.single('file'), authController.bulkUploadStudents);

module.exports = router;
