import express from 'express';
import authMiddleware, { adminAuth } from '../middleware/auth.js';
import { addReview, listSummaries, listReviews, deleteReview, adminList } from '../controllers/reviewController.js';
import { rateLimit } from '../middleware/rateLimit.js';

const reviewRouter = express.Router();
const reviewLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

// public read — summary first so it is not swallowed by /:foodId
reviewRouter.get('/summary', listSummaries);
reviewRouter.get('/admin/all', adminAuth, adminList);
reviewRouter.get('/:foodId', listReviews);
// customer writes (login required)
reviewRouter.post('/', reviewLimiter, authMiddleware, addReview);
// admin moderation
reviewRouter.delete('/:id', adminAuth, deleteReview);

export default reviewRouter;
