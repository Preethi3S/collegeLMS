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
