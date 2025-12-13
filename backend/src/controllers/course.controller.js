const mongoose = require('mongoose');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const { parseExcelFile } = require('../utils/excel');
const fs = require('fs');

/**
 * 🧠 Create a new course (Admin)
 */
exports.createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            allowedYears,
            allowedStudents,
            requiresSequentialProgress,
            levels,
            thumbnail,
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }

        const validatedYears = Array.isArray(allowedYears)
            ? allowedYears.map(Number).filter((y) => !isNaN(y))
            : [];

        // ✅ Convert allowedStudents to ObjectIds
        const validatedStudents = Array.isArray(allowedStudents)
            ? allowedStudents
                .filter((id) => typeof id === 'string' && id.trim())
                .map((id) => new mongoose.Types.ObjectId(id))
            : [];

        const processedLevels = Array.isArray(levels)
            ? levels.map((level, i) => ({
                title: level.title || `Level ${i + 1}`,
                description: level.description || 'No description provided',
                order: level.order || i + 1,
                modules: Array.isArray(level.modules)
                    ? level.modules.map((module, j) => ({
                        title: module.title || `Module ${j + 1}`,
                        description: module.description || '',
                        type: module.type || 'video',
                        content: module.content || '',
                        videoLength: module.videoLength || 0,
                        codingQuestions: module.codingQuestions || [],
                        order: module.order || j + 1,
                        resources: module.resources || [],
                    }))
                    : [],
            }))
            : [];

        const course = new Course({
            title,
            description,
            allowedYears: validatedYears,
            allowedStudents: validatedStudents,
            requiresSequentialProgress:
                typeof requiresSequentialProgress !== 'undefined'
                    ? requiresSequentialProgress
                    : true,
            levels: processedLevels,
            thumbnail: thumbnail || '',
        });

        await course.save();
        res.status(201).json({ message: 'Course created successfully.', course });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 🧠 Update an existing course (Admin)
 */
exports.updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const {
            title,
            description,
            allowedYears,
            allowedStudents,
            requiresSequentialProgress,
            levels,
            thumbnail,
        } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail !== undefined) course.thumbnail = thumbnail;
        if (requiresSequentialProgress !== undefined)
            course.requiresSequentialProgress = requiresSequentialProgress;

        if (Array.isArray(allowedYears))
            course.allowedYears = allowedYears.map(Number).filter((y) => !isNaN(y));

        // ✅ Store ObjectIds properly
        if (Array.isArray(allowedStudents))
            course.allowedStudents = allowedStudents
                .filter((id) => typeof id === 'string' && id.trim())
                .map((id) => new mongoose.Types.ObjectId(id));

        if (Array.isArray(levels)) {
            course.levels = levels.map((level, i) => ({
                title: level.title || `Level ${i + 1}`,
                description: level.description || '',
                order: level.order || i + 1,
                modules: Array.isArray(level.modules)
                    ? level.modules.map((module, j) => ({
                        title: module.title || `Module ${j + 1}`,
                        description: module.description || '',
                        type: module.type || 'video',
                        content: module.content || '',
                        videoLength: module.videoLength || 0,
                        order: module.order || j + 1,
                        resources: module.resources || [],
                    }))
                    : [],
            }));
        }

        await course.save();
        res.json({ message: 'Course updated successfully.', course });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 📚 Get all courses (Admin & Student View)
 */
exports.getCourses = async (req, res) => {
    try {
        const user = req.user;
        const onlyAvailable = req.query.onlyAvailable === 'true';
        const userObjectId = new mongoose.Types.ObjectId(user._id);

        // ✅ Admins see all
        if (user.role === 'admin') {
            const courses = await Course.find().lean();
            return res.json({ courses });
        }

        // ✅ Students see only allowed/global courses
        const filter = {
            $or: [
                // Allowed by Year
                { allowedYears: { $in: [user.year] } },
                // Allowed by Student
                { allowedStudents: { $in: [userObjectId] } },
                // Truly Global (no restrictions defined)
                {
                    $and: [
                        { $or: [{ allowedYears: { $exists: false } }, { allowedYears: { $size: 0 } }] },
                        { $or: [{ allowedStudents: { $exists: false } }, { allowedStudents: { $size: 0 } }] },
                    ],
                },
            ],
        };

        const courses = await Course.find(onlyAvailable ? filter : {}).lean();
        
        // For students, add enrollment status
        if (user.role === 'student') {
            const enrolledCourseIds = user.enrolledCourses || [];
            courses.forEach(course => {
                course.isEnrolled = enrolledCourseIds.includes(course._id.toString());
            });
        }
        
        res.json({ courses });
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 📘 Get single course (Access controlled)
 */
exports.getCourse = async (req, res) => {
    try {
        const user = req.user;
        const courseId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        let course;
        const userObjectId = new mongoose.Types.ObjectId(user._id);

        if (user.role === 'admin') {
            course = await Course.findById(courseId).lean();
        } else {
            // Student access logic: Year OR Student OR Global
            course = await Course.findOne({
                _id: courseId,
                $or: [
                    { allowedYears: { $in: [user.year] } },
                    { allowedStudents: { $in: [userObjectId] } },
                    {
                        $and: [
                            { $or: [{ allowedYears: { $exists: false } }, { allowedYears: { $size: 0 } }] },
                            { $or: [{ allowedStudents: { $exists: false } }, { allowedStudents: { $size: 0 } }] },
                        ],
                    },
                ],
            }).lean();
        }

        if (!course) {
            return res.status(404).json({ message: 'Course not found or access denied' });
        }

        res.json({ course });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 👨‍🎓 Enroll in a course (Student or Admin)
 */
exports.enroll = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        let studentId = req.user._id;
        if (req.user.role === 'admin' && req.body.studentId) {
            studentId = req.body.studentId;
        }

        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const allowedByYear =
            Array.isArray(course.allowedYears) && course.allowedYears.includes(student.year);

        const allowedByStudent =
            Array.isArray(course.allowedStudents) &&
            course.allowedStudents.some((sid) => sid.equals(student._id));

        const isGlobal =
            (!course.allowedYears || course.allowedYears.length === 0) &&
            (!course.allowedStudents || course.allowedStudents.length === 0);

        if (!allowedByYear && !allowedByStudent && !isGlobal) {
            return res.status(403).json({ message: 'Course not available for this student' });
        }

        if (!course.students.some((sid) => sid.equals(student._id))) {
            course.students.push(student._id);
            await course.save();
        }

        if (!student.enrolledCourses.includes(course._id)) {
            student.enrolledCourses.push(course._id);
            await student.save();
        }

        res.json({ message: 'Enrolled successfully' });
    } catch (error) {
        console.error('Error enrolling:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 📊 Export Courses (Admin)
 */
exports.exportCourses = async (req, res) => {
    try {
        const courses = await Course.find();

        const rows = [
            ['Title', 'Description', 'AllowedYears', 'StudentsCount', 'CreatedAt'],
        ];

        for (const c of courses) {
            rows.push([
                c.title,
                c.description?.replace(/\r|\n/g, ' '),
                (c.allowedYears || []).join(', '),
                (c.students || []).length,
                c.createdAt ? c.createdAt.toISOString() : '',
            ]);
        }

        const csv = rows
            .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const filename = `courses_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 🗑 Delete a course (Admin)
 */
exports.deleteCourse = async (req, res) => {
    try {
        // FindByIdAndDelete deletes the course document
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        // OPTIONAL: Clean up associated Progress documents
        // const Progress = require('../models/progress.model'); // Ensure Progress model is accessible
        // await Progress.deleteMany({ course: req.params.id }); 

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};