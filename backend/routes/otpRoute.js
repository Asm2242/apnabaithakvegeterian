import express from 'express';
import { requestOtp, verifyOtp, startOtp, loginWithOtp, checkCustomer, fireLogin, diag, testSend } from '../controllers/otpController.js';
import authMiddleware from '../middleware/auth.js';

const otpRouter = express.Router();

// logged-in linking
otpRouter.post("/request", authMiddleware, requestOtp);
otpRouter.post("/verify", authMiddleware, verifyOtp);
// public start-page OTP login (no token needed)
otpRouter.post("/check", checkCustomer);
otpRouter.post("/start", startOtp);
otpRouter.post("/login", loginWithOtp);
otpRouter.post("/firelogin", fireLogin);
// diagnostics (no auth — shows config only, no secrets)
otpRouter.get("/diag", diag);
otpRouter.post("/testsend", testSend);

export default otpRouter;
