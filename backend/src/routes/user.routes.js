const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// 🧑‍🎓 Authenticated user routes
router.get('/me', auth, userController.getProfile);
router.put('/me', auth, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), userController.updateProfile);
router.get('/dashboard', auth, userController.getDashboard);
router.get('/admin-id', auth, userController.getAdminId);

// 🧠 Admin-only routes
router.get('/students', auth, adminOnly, userController.listStudents);
router.post('/students/create', auth, adminOnly, userController.createStudent);
router.post('/students/upload', auth, adminOnly, upload.single('file'), userController.uploadStudents);
router.post('/students/delete-bulk', auth, adminOnly, upload.single('file'), userController.deleteStudents);
router.get('/students/:id', auth, adminOnly, userController.getStudent);
router.put('/students/:id', auth, adminOnly, userController.updateStudent);
router.delete('/students/:id', auth, adminOnly, userController.deleteStudent);

module.exports = router;
