const mongoose = require('mongoose');

const watchSessionSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // seconds watched this session
  percentWatched: { type: Number, default: 0 },
});

const moduleProgressSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  totalWatched: { type: Number, default: 0 }, // total seconds
  percentWatched: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  firstWatchedAt: { type: Date },
  lastWatchedAt: { type: Date },
  resumeAt: { type: Number, default: 0 }, // last timestamp in video
  watchSessions: [watchSessionSchema],
});

const levelProgressSchema = new mongoose.Schema({
  levelId: { type: mongoose.Schema.Types.ObjectId, required: true },
  moduleProgress: [moduleProgressSchema],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  totalTimeSpent: { type: Number, default: 0 },
});

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  levels: [levelProgressSchema],
  overallProgress: { type: Number, default: 0 },
  totalWatchTime: { type: Number, default: 0 },
  completionDuration: { type: Number, default: 0 }, // in seconds
  startedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now }
});

progressSchema.pre('save', function (next) {
  this.lastAccessedAt = Date.now();
  next();
});

module.exports = mongoose.model('Progress', progressSchema);
