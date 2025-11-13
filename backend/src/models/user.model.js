const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        default: 'student'
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    rollNumber: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    age: {
        type: Number,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    resume: {
        type: String,
        default: ''
    },
    cgpa: {
        type: Number,
        default: null
    },
    percentage12: {
        type: Number,
        default: null
    },
    percentage10: {
        type: Number,
        default: null
    },
    hasArrears: {
        type: Boolean,
        default: false
    },
    skills: [{
        type: String
    }],
    codingPlatformLink: {
        type: String,
        default: ''
    },
    githubLink: {
        type: String,
        default: ''
    },
    linkedinLink: {
        type: String,
        default: ''
    },
    year: {
        type: Number,
        required: function() {
            return this.role === 'student';
        }
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);