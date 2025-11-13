const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/user.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college-lms';

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin user already exists:', existing.email);
    process.exit(0);
  }

  const admin = new User({
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  });

  await admin.save();
  console.log('Created admin user: admin / Admin123!');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
