const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const config = require('../src/config');

const createStudent = async () => {
    try {
        console.log('Connecting to MongoDB...', config.mongoURI);
        await mongoose.connect(config.mongoURI);
        console.log('MongoDB Connected');

        const studentData = {
            username: 'teststudent',
            email: 'teststudent@college.edu',
            password: 'password123',
            role: 'student',
            firstName: 'Test',
            lastName: 'Student',
            profileImage: '',
            rollNumber: 'STUDENT001',
            department: 'Computer Science',
            age: 20,
            dateOfBirth: new Date('2003-01-01'),
            year: 3, // Required for students
            cgpa: 8.5,
            skills: ['JavaScript', 'React', 'Node.js']
        };

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: studentData.email }, { username: studentData.username }] });
        if (existingUser) {
            console.log('Student already exists:', existingUser.username);
            return;
        }

        const user = new User(studentData);
        await user.save();
        console.log('Student created successfully');
        console.log('Username:', studentData.username);
        console.log('Password:', studentData.password);

    } catch (error) {
        console.error('Error creating student:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

createStudent();
