import express from 'express';
import { listCoupons, validateCoupon, adminList, adminSave, adminToggle } from '../controllers/couponController.js';
import authMiddleware, { adminAuth } from '../middleware/auth.js';

const couponRouter = express.Router();

couponRouter.get("/list", listCoupons);
couponRouter.post("/validate", authMiddleware, validateCoupon);
couponRouter.get("/admin/all", adminAuth, adminList);
couponRouter.post("/admin/save", adminAuth, adminSave);
couponRouter.post("/admin/toggle", adminAuth, adminToggle);

export default couponRouter;
