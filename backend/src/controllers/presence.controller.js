const Presence = require('../models/presence.model');

// Heartbeat: increment seconds for today for the authenticated student
exports.heartbeat = async (req, res) => {
  try {
    const student = req.user._id;
    const { seconds = 60 } = req.body; // default increment 60s
    const today = new Date().toISOString().slice(0, 10);

    const doc = await Presence.findOneAndUpdate(
      { student, date: today },
      { $inc: { seconds }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ presence: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get presence for last N days
exports.getPresence = async (req, res) => {
  try {
    const student = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    const sinceStr = since.toISOString().slice(0,10);

    const records = await Presence.find({ student, date: { $gte: sinceStr } }).sort({ date: 1 }).lean();
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
