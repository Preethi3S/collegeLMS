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
        if (req.files) {
            if (req.files.file && req.files.file[0]) {
                const url = await uploadToCloudinary(req.files.file[0]);
                updates.profileImage = url;
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
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const rows = parseExcelFile(req.file.path);
        const created = [];
        const skipped = [];

        for (const row of rows) {
            const username = (row.username || row.Username || '').toString().trim();
            const email = (row.email || row.Email || '').toString().trim();
            const password = (row.password || row.Password || '').toString().trim();

            if (!username || !email || !password) {
                skipped.push({ row, reason: 'Missing required field' });
                continue;
            }

            const exists = await User.findOne({ $or: [{ username }, { email }] });
            if (exists) {
                skipped.push({ row, reason: 'User exists' });
                continue;
            }

            const names = username.split(/\.|_|-|\s+/).map(s => s.trim()).filter(Boolean);
            const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : 'Student';
            const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : '';

            const user = new User({ username, email, password, role: 'student', firstName, lastName, year: 1 });
            await user.save();
            created.push({ username, email });
        }

        // remove uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) { }

        res.json({ createdCount: created.length, skipped });
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

        // Get progress entries and populate course info
        const progresses = await Progress.find({ student: studentId }).populate('course').lean();

        // Calculate hours spent (seconds -> hours), lessons count, courses count
        let totalSeconds = 0;
        let lessonsCount = 0;
        const courses = [];

        for (const p of progresses) {
            totalSeconds += p.totalWatchTime || 0;
            if (p.course) {
                // count modules
                const levels = p.course.levels || [];
                for (const lvl of levels) {
                    lessonsCount += (lvl.modules || []).length;
                }
                courses.push({
                    id: p.course._id,
                    title: p.course.title,
                    thumbnail: p.course.thumbnail,
                    progress: p.overallProgress || 0,
                });
            }
        }

        // If user has enrolledCourses directly on their user doc, include those not in progresses
        const user = await User.findById(studentId).lean();
        const enrolled = user?.enrolledCourses || [];
        if (enrolled.length) {
            const missing = await Course.find({ _id: { $in: enrolled.filter((id) => !courses.find(c => String(c.id) === String(id))) } }).lean();
            for (const c of missing) {
                let mcount = 0;
                for (const lvl of (c.levels || [])) mcount += (lvl.modules || []).length;
                lessonsCount += mcount;
                courses.push({ id: c._id, title: c.title, thumbnail: c.thumbnail, progress: 0 });
            }
        }

        const hours = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal hour

        res.json({
            stats: {
                lessons: lessonsCount,
                assignments: 0,
                tests: 0,
                hours: hours,
                coursesCount: courses.length,
            },
            courses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
