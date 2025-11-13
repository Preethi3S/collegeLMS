const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { auth, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// 📘 Create new course
router.post('/', auth, adminOnly, courseController.createCourse);

// 📚 Get all courses
router.get('/', auth, courseController.getCourses);

// 📘 Get single course
router.get('/:id', auth, courseController.getCourse);

// 👨‍🎓 Enroll student
router.post('/:id/enroll', auth, courseController.enroll);

// ✏️ Update course
router.put('/:id', auth, adminOnly, courseController.updateCourse);

// 🗑 Delete course (Now uses controller function)
router.delete('/:id', auth, adminOnly, courseController.deleteCourse);

// 📤 Export courses
router.get('/export', auth, adminOnly, courseController.exportCourses);

module.exports = router;