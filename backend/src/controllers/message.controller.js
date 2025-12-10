const Message = require('../models/message.model');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, subject, content } = req.body;
        if (!receiverId || !subject || !content) return res.status(400).json({ message: 'Missing fields' });

        const message = new Message({ sender: req.user._id, receiver: receiverId, subject, content });
        await message.save();
        res.status(201).json({ message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInbox = async (req, res) => {
    try {
        const messages = await Message.find({ receiver: req.user._id }).populate('sender', 'firstName lastName email').sort('-createdAt');
        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSent = async (req, res) => {
    try {
        const messages = await Message.find({ sender: req.user._id }).populate('receiver', 'firstName lastName email').sort('-createdAt');
        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.receiver.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        message.read = true;
        await message.save();
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({ receiver: req.user._id, read: false });
        res.json({ unreadCount: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send message to multiple recipients (by year, department, email, rollno, or individual)
exports.sendBulkMessage = async (req, res) => {
    try {
        const User = require('../models/user.model');
        const { subject, content, filterType, filterValue } = req.body;

        if (!subject || !content) return res.status(400).json({ message: 'Subject and content required' });

        let recipients = [];

        if (filterType === 'email') {
            const user = await User.findOne({ email: filterValue });
            if (user) recipients = [user._id];
        } else if (filterType === 'rollno') {
            const user = await User.findOne({ rollNumber: filterValue });
            if (user) recipients = [user._id];
        } else if (filterType === 'year') {
            const users = await User.find({ role: 'student', year: parseInt(filterValue) });
            recipients = users.map(u => u._id);
        } else if (filterType === 'department') {
            const users = await User.find({ role: 'student', department: filterValue });
            recipients = users.map(u => u._id);
        } else if (filterType === 'year-department') {
            const [year, dept] = filterValue.split('|');
            const users = await User.find({ role: 'student', year: parseInt(year), department: dept });
            recipients = users.map(u => u._id);
        }

        const messages = recipients.map(rid => ({
            sender: req.user._id,
            receiver: rid,
            subject,
            content,
            read: false
        }));

        if (messages.length > 0) {
            await Message.insertMany(messages);
        }

        res.json({ message: `Message sent to ${messages.length} recipient(s)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
