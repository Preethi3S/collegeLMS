const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  seconds: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

presenceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Presence', presenceSchema);
