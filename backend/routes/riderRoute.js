import express from 'express';
import {
    createRider, loginRider, myOrders,
    updateDeliveryStatus, updateLocation, listRiders, collectCash,
    payLink, payCheck
} from '../controllers/riderController.js';
import { adminAuth, riderAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const riderRouter = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });

// admin creates rider accounts
riderRouter.post("/create", adminAuth, createRider);
// rider login (public — role checked inside)
riderRouter.post("/login", loginLimiter, loginRider);
// rider's assigned orders + status + location
riderRouter.get("/myorders", riderAuth, myOrders);
riderRouter.post("/status", riderAuth, updateDeliveryStatus);
riderRouter.post("/location", riderAuth, updateLocation);
riderRouter.post("/collect", riderAuth, collectCash);
riderRouter.post("/paylink", riderAuth, payLink);
riderRouter.post("/paycheck", riderAuth, payCheck);
// admin: all riders
riderRouter.get("/list", adminAuth, listRiders);

export default riderRouter;
