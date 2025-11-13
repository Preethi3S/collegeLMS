const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { auth, adminOnly } = require('../middleware/auth.middleware');

// 1. 🧾 Admin analytics (MUST BE FIRST to avoid conflict with /:moduleId)
router.get('/:courseId/analytics', auth, adminOnly, progressController.getDetailedCourseAnalytics);

// 2. 🎬 Record watch session
router.post('/:courseId/:moduleId/watch', auth, progressController.recordWatchSession);

// 3. ✅ Mark module as complete
router.post('/:courseId/:moduleId/complete', auth, progressController.markModuleComplete);

// 4. 📈 Get specific module progress
router.get('/:courseId/:moduleId', auth, progressController.getModuleProgress);

// 5. 📊 Get course progress
router.get('/:courseId', auth, progressController.getCourseProgress);

module.exports = router;