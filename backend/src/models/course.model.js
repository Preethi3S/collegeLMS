const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'video' },
  content: { type: String, required: true }, // YouTube URL or main content
  videoLength: { type: Number, default: 0 },
  codingQuestions: [ // Array of coding question URLs
    {
      title: { type: String, default: 'Coding Question' },
      url: { type: String, required: true },
    }
  ],
  order: { type: Number, default: 1 },
  resources: [
    {
      title: String,
      fileUrl: String,
      fileType: String,
    },
  ],
});

const levelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 1 },
  modules: [moduleSchema],
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  allowedYears: [{ type: Number }],
  allowedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requiresSequentialProgress: { type: Boolean, default: true },
  levels: [levelSchema],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

courseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);
