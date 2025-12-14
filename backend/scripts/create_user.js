const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const config = require('../src/config');

const createUser = async () => {
    try {
        console.log('Connecting to MongoDB...', config.mongoURI);
        await mongoose.connect(config.mongoURI);
        console.log('MongoDB Connected');

        const userData = {
            username: 'testadmin',
            email: 'testadmin@college.edu',
            password: 'password123',
            role: 'admin',
            firstName: 'Test',
            lastName: 'Admin',
            profileImage: '',
            rollNumber: 'ADMIN001',
            department: 'Administration',
            age: 30,
            dateOfBirth: new Date('1993-01-01')
        };

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: userData.email }, { username: userData.username }] });
        if (existingUser) {
            console.log('User already exists:', existingUser.username);
            return;
        }

        const user = new User(userData);
        await user.save();
        console.log('User created successfully');
        console.log('Username:', userData.username);
        console.log('Password:', userData.password);

    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

createUser();
