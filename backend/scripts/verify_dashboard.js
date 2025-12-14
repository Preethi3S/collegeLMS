const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Course = require('../src/models/course.model');
const Progress = require('../src/models/progress.model');
const userController = require('../src/controllers/user.controller');
const config = require('../src/config');

// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.json = (data) => {
        console.log('Response JSON:', JSON.stringify(data, null, 2));
        return res;
    };
    res.status = (code) => {
        console.log('Response Status:', code);
        return res;
    };
    return res;
};

const verifyDashboard = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoURI);

        // 1. Find the test student
        const student = await User.findOne({ username: 'teststudent' });
        if (!student) {
            console.log('Student not found. Please run create_student.js first.');
            return;
        }
        console.log('Found student:', student.username);

        // 2. Ensure a course exists and enroll the student if needed
        let course = await Course.findOne();
        if (!course) {
            console.log('No courses found. Creating a dummy course...');
            course = new Course({
                title: 'Introduction to Programming',
                description: 'Learn the basics',
                thumbnail: 'https://via.placeholder.com/150',
                levels: [],
                allowedYears: [1, 2, 3, 4]
            });
            await course.save();
            console.log('Created dummy course:', course.title);
        }

        // Enroll if not already enrolled
        if (!student.enrolledCourses.includes(course._id)) {
            console.log('Enrolling student in course...');
            student.enrolledCourses.push(course._id);
            await student.save();
        } else {
            console.log('Student already enrolled in course:', course.title);
        }

        // 3. Call getDashboard
        console.log('Calling getDashboard...');
        const req = {
            user: student
        };
        await userController.getDashboard(req, mockRes());

    } catch (error) {
        console.error('Error verifying dashboard:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

verifyDashboard();
