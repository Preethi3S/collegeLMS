const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user.model');
const { parseExcelFile } = require('../utils/excel');
const fs = require('fs');

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or username
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, email: user.email, role: user.role, username: user.username } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin creates a student manually
exports.createStudent = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, year } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: 'User with email or username already exists' });

        const user = new User({ username, email, password, firstName, lastName, year, role: 'student' });
        await user.save();

        res.status(201).json({ message: 'Student created', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin bulk upload students via Excel file
exports.bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const rows = parseExcelFile(req.file.path);
        const created = [];
        const skipped = [];

        for (const row of rows) {
            // Expect columns: username, email, firstName, lastName, year, password(optional)
            const username = row.username || row.Username || row.username?.toString();
            const email = row.email || row.Email;
            const firstName = row.firstName || row.FirstName || row.first_name;
            const lastName = row.lastName || row.LastName || row.last_name;
            const year = parseInt(row.year || row.Year || row.year_of_study) || null;
            const password = row.password || 'ChangeMe123!';

            if (!username || !email || !firstName || !lastName || !year) {
                skipped.push({ row, reason: 'Missing required fields' });
                continue;
            }

            const exists = await User.findOne({ $or: [{ email }, { username }] });
            if (exists) {
                skipped.push({ row, reason: 'Already exists' });
                continue;
            }

            const user = new User({ username, email, password, firstName, lastName, year, role: 'student' });
            await user.save();
            created.push(user._id);
        }

        // Remove uploaded file
        fs.unlink(req.file.path, () => {});

        res.json({ createdCount: created.length, skipped, created });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
