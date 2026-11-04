import express from 'express';
import feedbackModel from '../models/feedbackModel.js';
import { adminAuth } from '../middleware/auth.js';

const feedbackRouter = express.Router();

// POST /api/feedback — customer submits (public)
feedbackRouter.post('/', async (req, res) => {
    try {
        const { name, phone, rating, message } = req.body;
        if (!message || !String(message).trim()) {
            return res.json({ success: false, message: 'Please write your feedback' });
        }
        await new feedbackModel({
            name: String(name || 'Guest').trim().slice(0, 40) || 'Guest',
            phone: String(phone || '').replace(/\D/g, '').slice(-10),
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            message: String(message).trim().slice(0, 600)
        }).save();
        res.json({ success: true, message: 'Thank you! Your feedback reached the kitchen. 🪔' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Could not send feedback' });
    }
});

// GET /api/feedback — admin list
feedbackRouter.get('/', adminAuth, async (req, res) => {
    try {
        const list = await feedbackModel.find({}).sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, data: list });
    } catch (error) {
        res.json({ success: false, message: 'Error' });
    }
});

// POST /api/feedback/seen — admin marks as read
feedbackRouter.post('/seen', adminAuth, async (req, res) => {
    try {
        await feedbackModel.findByIdAndUpdate(req.body.id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Error' });
    }
});

// POST /api/feedback/delete — admin removes
feedbackRouter.post('/delete', adminAuth, async (req, res) => {
    try {
        await feedbackModel.findByIdAndDelete(req.body.id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Error' });
    }
});

export default feedbackRouter;