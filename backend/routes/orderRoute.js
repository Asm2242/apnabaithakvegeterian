import express from 'express';
import authMiddleware, { adminAuth } from '../middleware/auth.js';
import { listOrders, placeOrder,updateStatus,userOrders, verifyOrder, markFailed } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get("/list",adminAuth,listOrders);
orderRouter.post("/userorders",authMiddleware,userOrders);
orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/status",adminAuth,updateStatus);
orderRouter.post("/verify",verifyOrder);
orderRouter.post("/failed",authMiddleware,markFailed);

export default orderRouter;