import express from 'express';
import { requestOtp, verifyOtp, startOtp, loginWithOtp, checkCustomer, fireLogin, diag, testSend } from '../controllers/otpController.js';
import authMiddleware, { adminAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const otpRouter = express.Router();
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

// logged-in linking
otpRouter.post("/request", authMiddleware, requestOtp);
otpRouter.post("/verify", authMiddleware, verifyOtp);
// public start-page OTP login (no token needed)
otpRouter.post("/check", otpLimiter, checkCustomer);
otpRouter.post("/start", otpLimiter, startOtp);
otpRouter.post("/login", otpLimiter, loginWithOtp);
otpRouter.post("/firelogin", otpLimiter, fireLogin);
// diagnostics — ADMIN ONLY (these can send real SMS, must not be public)
otpRouter.get("/diag", adminAuth, diag);
otpRouter.get("/testsend", adminAuth, testSend);
otpRouter.post("/testsend", adminAuth, testSend);

export default otpRouter;
