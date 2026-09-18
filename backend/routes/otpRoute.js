import express from 'express';
import { requestOtp, verifyOtp, startOtp, loginWithOtp } from '../controllers/otpController.js';
import authMiddleware from '../middleware/auth.js';

const otpRouter = express.Router();

// logged-in linking
otpRouter.post("/request", authMiddleware, requestOtp);
otpRouter.post("/verify", authMiddleware, verifyOtp);
// public start-page OTP login (no token needed)
otpRouter.post("/start", startOtp);
otpRouter.post("/login", loginWithOtp);

export default otpRouter;
