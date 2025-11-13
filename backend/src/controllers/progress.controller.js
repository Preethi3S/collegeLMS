const mongoose = require('mongoose');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Progress = require('../models/progress.model');

// 🎬 Record video watch session
exports.recordWatchSession = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { watchTime, percentWatched, totalLength, resumeAt } = req.body;
        const studentId = req.user._id;

        // Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(courseId) ||
            !mongoose.Types.ObjectId.isValid(moduleId)
        ) {
            return res.status(400).json({ message: 'Invalid courseId or moduleId' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        let progress = await Progress.findOne({ student: studentId, course: courseId });

        if (!progress) {
            // Initialize levels structure when creating a new progress document
            const initialLevels = course.levels.map((lvl) => ({
                levelId: lvl._id,
                moduleProgress: lvl.modules.map((m) => ({
                    moduleId: m._id,
                    totalWatched: 0,
                    percentWatched: 0,
                    completed: false,
                    watchSessions: [],
                })),
            }));

            progress = new Progress({
                student: studentId,
                course: courseId,
                startedAt: new Date(),
                levels: initialLevels // Initialize it here
            });
        }
        
        // This check is redundant after the above fix but kept for robustness 
        // in case the course structure changes.
        if (!progress.levels || progress.levels.length === 0) {
            progress.levels = course.levels.map((lvl) => ({
                levelId: lvl._id,
                moduleProgress: lvl.modules.map((m) => ({
                    moduleId: m._id,
                    totalWatched: 0,
                    percentWatched: 0,
                    completed: false,
                    watchSessions: [],
                })),
            }));
        }

        const lvl = progress.levels.find((l) =>
            l.moduleProgress.some((m) => String(m.moduleId) === String(moduleId))
        );
        const modProg = lvl?.moduleProgress.find((m) => String(m.moduleId) === String(moduleId));
        if (!modProg) return res.status(404).json({ message: 'Module not found in progress' });

        // Add session and update
        const session = {
            moduleId,
            startedAt: new Date(),
            endedAt: new Date(),
            duration: watchTime,
            percentWatched,
        };
        modProg.watchSessions.push(session);

        modProg.totalWatched += watchTime;
        modProg.percentWatched = Math.max(modProg.percentWatched, percentWatched);
        modProg.lastWatchedAt = new Date();
        modProg.resumeAt = resumeAt || 0;

        if (percentWatched >= 90 && !modProg.completed) {
            modProg.completed = true;
            modProg.completedAt = new Date();
        }

        lvl.completed = lvl.moduleProgress.every((m) => m.completed);
        lvl.totalTimeSpent = lvl.moduleProgress.reduce((s, m) => s + (m.totalWatched || 0), 0);
        if (lvl.completed && !lvl.completedAt) lvl.completedAt = new Date();

        const totalModules = course.levels.reduce((sum, lv) => sum + lv.modules.length, 0);
        const completedModules = progress.levels.reduce(
            (sum, lv) => sum + lv.moduleProgress.filter((m) => m.completed).length,
            0
        );

        progress.overallProgress = Math.round((completedModules / totalModules) * 100);
        progress.totalWatchTime = progress.levels.reduce((s, lv) => s + (lv.totalTimeSpent || 0), 0);
        progress.lastAccessedAt = new Date();

        await progress.save();
        res.json({ message: 'Watch session recorded', progress });
    } catch (err) {
        console.error('Error recording watch session:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 📊 Get course progress
exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid or missing courseId' });
        }

        const progress = await Progress.findOne({ student: studentId, course: courseId });
        if (!progress) {
            return res.status(200).json({
                progress: {
                    overallProgress: 0,
                    totalWatchTime: 0,
                    levels: [],
                },
            });
        }

        res.json({ progress });
    } catch (err) {
        console.error('Error fetching course progress:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 📈 Get module progress
exports.getModuleProgress = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const studentId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(courseId) ||
            !mongoose.Types.ObjectId.isValid(moduleId)
        ) {
            return res.status(400).json({ message: 'Invalid courseId or moduleId' });
        }

        const progress = await Progress.findOne({ student: studentId, course: courseId });
        if (!progress) return res.status(200).json({ progress: null });

        for (const lvl of progress.levels) {
            const mod = lvl.moduleProgress.find((m) => String(m.moduleId) === String(moduleId));
            if (mod) return res.json({ progress: mod });
        }

        res.json({ progress: null });
    } catch (err) {
        console.error('Error fetching module progress:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Mark module complete manually
exports.markModuleComplete = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const studentId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(courseId) ||
            !mongoose.Types.ObjectId.isValid(moduleId)
        ) {
            return res.status(400).json({ message: 'Invalid courseId or moduleId' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        let progress = await Progress.findOne({ student: studentId, course: courseId });
        if (!progress) {
            progress = new Progress({ student: studentId, course: courseId, startedAt: new Date() });
            progress.levels = course.levels.map((lvl) => ({
                levelId: lvl._id,
                moduleProgress: lvl.modules.map((m) => ({ moduleId: m._id })),
            }));
        }

        for (const lvl of progress.levels) {
            for (const mod of lvl.moduleProgress) {
                if (String(mod.moduleId) === String(moduleId)) {
                    mod.completed = true;
                    mod.percentWatched = 100;
                    mod.completedAt = new Date();
                }
            }
        }

        const totalModules = course.levels.reduce((sum, l) => sum + l.modules.length, 0);
        const completedModules = progress.levels.reduce(
            (sum, l) => sum + l.moduleProgress.filter((m) => m.completed).length,
            0
        );
        progress.overallProgress = Math.round((completedModules / totalModules) * 100);

        await progress.save();
        res.json({ message: 'Module marked complete', progress });
    } catch (err) {
        console.error('Error marking module complete:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 🧾 Admin analytics
exports.getDetailedCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId) {
            return res.status(400).json({ message: 'Missing courseId' });
        }
        // This validation check is crucial and is now executed for the correct route
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: `Invalid courseId: ${courseId}` });
        }

        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin only' });
        }

        // Fetch course to get total modules/levels for calculations
        const course = await Course.findById(courseId).select('levels').lean();
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const progresses = await Progress.find({ course: courseId })
            .populate('student', 'firstName lastName email rollNumber department')
            .lean();

        // Helper to calculate progress for each student
        const detailedAnalytics = progresses.map((p) => {
            
            // Calculate Level and Module Progress details
            const levelsProgress = course.levels.map(courseLvl => {
                const studentLvl = p.levels.find(pl => String(pl.levelId) === String(courseLvl._id));
                const totalModulesInLevel = courseLvl.modules.length;
                
                let completedModulesInLevel = 0;
                let moduleProgress = [];

                if (studentLvl) {
                    completedModulesInLevel = studentLvl.moduleProgress.filter(m => m.completed).length;
                    
                    // Map modules in this level to their individual progress
                    moduleProgress = courseLvl.modules.map(courseMod => {
                        const studentMod = studentLvl.moduleProgress.find(pm => String(pm.moduleId) === String(courseMod._id));
                        return {
                            moduleId: courseMod._id,
                            moduleTitle: courseMod.title,
                            percentWatched: studentMod?.percentWatched || 0,
                            completed: studentMod?.completed || false,
                        };
                    });
                }
                
                const levelOverallProgress = totalModulesInLevel > 0 ? Math.round((completedModulesInLevel / totalModulesInLevel) * 100) : 0;
                
                return {
                    levelId: courseLvl._id,
                    levelTitle: courseLvl.title,
                    progress: levelOverallProgress, // 0-100% completion of modules in this level
                    completed: completedModulesInLevel === totalModulesInLevel,
                    moduleProgress: moduleProgress, // Detailed module data
                };
            });


            return {
                student: p.student,
                overallProgress: p.overallProgress,
                totalWatchTime: p.totalWatchTime,
                completionDuration: p.completionDuration,
                lastAccessedAt: p.lastAccessedAt,
                // NEW fields
                levelsProgress: levelsProgress, 
            };
        });

        res.json({
            analytics: detailedAnalytics, // Return the enhanced array
        });
    } catch (err) {
        console.error('Error getting analytics:', err);
        res.status(500).json({ message: 'Server error' });
    }
};