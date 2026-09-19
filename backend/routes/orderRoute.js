import express from 'express';
import authMiddleware, { adminAuth } from '../middleware/auth.js';
import { listOrders, placeOrder,updateStatus,userOrders, verifyOrder, markFailed, trackOrder } from '../controllers/orderController.js';
import { createRequest, myRequests, listRequests, resolveRequest } from '../controllers/requestController.js';

const orderRouter = express.Router();

orderRouter.get("/list",adminAuth,listOrders);
orderRouter.post("/userorders",authMiddleware,userOrders);
orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/status",adminAuth,updateStatus);
orderRouter.post("/verify",verifyOrder);
orderRouter.post("/failed",authMiddleware,markFailed);
orderRouter.get("/track/:id",authMiddleware,trackOrder);
// customer requests (cancel / change / remove) + admin handling
orderRouter.post("/request",authMiddleware,createRequest);
orderRouter.get("/requests/:orderId",authMiddleware,myRequests);
orderRouter.get("/requests",adminAuth,listRequests);
orderRouter.post("/request/resolve",adminAuth,resolveRequest);

export default orderRouter;