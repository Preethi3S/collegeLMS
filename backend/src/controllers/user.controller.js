const User = require('../models/user.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { parseExcelFile } = require('../utils/excel');
const fs = require('fs');
const path = require('path');
const Progress = require('../models/progress.model');
const Course = require('../models/course.model');

exports.getProfile = async (req, res) => {
    res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body || {};

        // If files uploaded, handle profile image and resume
        // If files uploaded, handle profile image and resume
        if (req.files) {
            if (req.files.file && req.files.file[0]) {
                // Convert to Base64
                const file = req.files.file[0];
                const bitmap = fs.readFileSync(file.path);
                const base64 = Buffer.from(bitmap).toString('base64');
                const pImage = `data:${file.mimetype};base64,${base64}`;
                updates.profileImage = pImage;

                // Clean up temp file
                try { fs.unlinkSync(file.path); } catch (e) { }
            }
            if (req.files.resume && req.files.resume[0]) {
                const url = await uploadToCloudinary(req.files.resume[0]);
                updates.resume = url;
            }
        }

        // parse certain fields types
        if (updates.skills && typeof updates.skills === 'string') {
            try { updates.skills = JSON.parse(updates.skills); } catch (e) { updates.skills = updates.skills.split(',').map(s => s.trim()); }
        }
        if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: list all students
exports.listStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json({ students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: bulk upload students from Excel/CSV
exports.uploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const rows = parseExcelFile(req.file.path);

        const created = [];
        const skipped = [];

        for (const row of rows) {
            // Normalize fields from Excel
            const username = String(row.username || row.Username || '').trim();
            const email = String(row.email || row.Email || '').trim();
            const password = String(row.password || row.Password || '').trim();

            const firstName = String(
                row.firstName || row.firstname || row.FirstName || ''
            ).trim();

            const lastName = String(
                row.lastName || row.lastname || row.LastName || ''
            ).trim();

            const rollNumber = String(
                row.rollNumber ||
                row['roll number'] ||
                row.RollNumber ||
                ''
            ).trim();

            const department = String(
                row.department || row.Department || ''
            ).trim();

            const year = Number(row.year || row.Year);

            // Validation
            if (!username || !email || !password || !year) {
                skipped.push({
                    row,
                    reason: 'Missing required fields (username/email/password/year)',
                });
                continue;
            }

            if (isNaN(year) || year < 1 || year > 4) {
                skipped.push({ row, reason: 'Invalid year (must be 1–4)' });
                continue;
            }

            // Check duplicate user
            const exists = await User.findOne({
                $or: [{ username }, { email }],
            });

            if (exists) {
                skipped.push({ row, reason: 'User already exists' });
                continue;
            }

            // Create student
            const user = new User({
                username,
                email,
                password,
                role: 'student',
                firstName: firstName || 'Student',
                lastName: lastName || '',
                year,
                rollNumber,
                department,
            });

            await user.save();

            created.push({ username, email });
        }

        // Cleanup uploaded file
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) { }

        res.json({
            createdCount: created.length,
            skippedCount: skipped.length,
            skipped,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Admin: get student by id
exports.getStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student) return res.status(404).json({ message: 'Not found' });
        res.json({ student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: update student by id
exports.updateStudent = async (req, res) => {
    try {
        const updates = req.body || {};
        if (req.files && req.files.resume && req.files.resume[0]) {
            const url = await uploadToCloudinary(req.files.resume[0]);
            updates.resume = url;
        }
        if (updates.skills && typeof updates.skills === 'string') {
            try { updates.skills = JSON.parse(updates.skills); } catch (e) { updates.skills = updates.skills.split(',').map(s => s.trim()); }
        }
        if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

        const student = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!student) return res.status(404).json({ message: 'Not found' });
        res.json({ student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: delete student
exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: bulk delete students from Excel/CSV
exports.deleteStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const rows = parseExcelFile(req.file.path);
        let deleted = 0;
        const failed = [];

        for (const row of rows) {
            const identifier = (row.email || row.Email || row.rollNumber || row.rollnumber || '').toString().trim();
            if (!identifier) {
                failed.push({ row, reason: 'No email or roll number' });
                continue;
            }

            try {
                const result = await User.findOneAndDelete({
                    $or: [{ email: identifier }, { rollNumber: identifier }],
                    role: 'student'
                });
                if (result) deleted++;
                else failed.push({ row, reason: 'Student not found' });
            } catch (e) {
                failed.push({ row, reason: e.message });
            }
        }

        try { fs.unlinkSync(req.file.path); } catch (e) { }

        res.json({ deletedCount: deleted, failed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createStudent = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, year, rollNumber, department } = req.body;

        if (!username || !email || !password) return res.status(400).json({ message: 'username, email and password required' });

        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) return res.status(400).json({ message: 'User with username or email already exists' });

        const user = new User({ username, email, password, role: 'student', firstName: firstName || '', lastName: lastName || '', year: year || 1, rollNumber: rollNumber || '', department: department || '' });
        await user.save();
        res.status(201).json({ user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Student dashboard data for authenticated user
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Get student with enrolled courses populated
        const user = await User.findById(studentId).populate('enrolledCourses').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get progress entries
        const progresses = await Progress.find({ student: studentId }).lean();

        // Create a map of progress by course ID for easy lookup
        const progressMap = {};
        progresses.forEach(p => {
            if (p.course) {
                progressMap[String(p.course)] = p;
            }
        });

        // Calculate stats
        let totalWatchTime = 0;
        let totalProgress = 0;
        let completedCourses = 0;
        const courses = [];

        // Iterate over ENROLLED courses
        if (user.enrolledCourses && user.enrolledCourses.length > 0) {
            for (const course of user.enrolledCourses) {
                const p = progressMap[String(course._id)];

                const courseProgress = p?.overallProgress || 0;
                const courseWatchTime = p?.totalWatchTime || 0;

                totalWatchTime += courseWatchTime;
                totalProgress += courseProgress;
                if (courseProgress >= 100) completedCourses++;

                courses.push({
                    id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail,
                    progress: courseProgress,
                });
            }
        }

        // Calculate extra stats from progresses that might not be in enrolledCourses (optional/edge case)
        // For accurate stats, we might want to only count enrolled ones, or all progress. 
        // Let's stick to enrolled courses for consistency with the list.

        // Overall progress as average of enrolled courses
        const enrolledCount = user.enrolledCourses?.length || 0;
        const overallProgress = enrolledCount > 0 ? Math.round(totalProgress / enrolledCount) : 0;

        // Calculate rank within department
        let rank = null;
        if (user?.department) {
            const deptStudents = await User.find({ department: user.department, role: 'student' }).select('_id').lean();
            const deptStudentIds = deptStudents.map(s => s._id);

            // Get all progresses for dept students
            const deptProgresses = await Progress.aggregate([
                { $match: { student: { $in: deptStudentIds } } },
                { $group: { _id: '$student', avgProgress: { $avg: '$overallProgress' }, completedCount: { $sum: { $cond: [{ $gte: ['$overallProgress', 100] }, 1, 0] } } } },
                { $sort: { avgProgress: -1, completedCount: -1 } }
            ]);

            const currentStudentProgress = deptProgresses.find(p => String(p._id) === String(studentId));
            if (currentStudentProgress) {
                rank = deptProgresses.findIndex(p => String(p._id) === String(studentId)) + 1;
            }
        }

        res.json({
            stats: {
                enrolledCourses: enrolledCount,
                overallProgress,
                watchTime: totalWatchTime,
                completedCourses,
                rank,
            },
            courses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get admin ID (for students to send messages to admin)
exports.getAdminId = async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' }).select('_id');
        if (!admin) {
            return res.status(404).json({ message: 'No admin found' });
        }
        res.json({ adminId: admin._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
