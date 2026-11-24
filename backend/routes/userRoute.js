import express from 'express';
import { loginUser, registerUser, getAddress, saveAddress, listAddresses, addAddress, updateAddress, deleteAddress, useAddress } from '../controllers/userController.js';
import { requestPasswordReset, resetPassword } from '../controllers/otpController.js';
import authMiddleware from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
const userRouter = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 8 });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

userRouter.post("/register", registerLimiter, registerUser);
userRouter.post("/login", authLimiter, loginUser);
// forgot password: phone OTP → reset password (public)
userRouter.post("/forgot-password/request", resetLimiter, requestPasswordReset);
userRouter.post("/forgot-password/reset", resetLimiter, resetPassword);
userRouter.get("/address",authMiddleware,getAddress);
userRouter.post("/address",authMiddleware,saveAddress);
// multiple addresses
userRouter.get("/addresses",authMiddleware,listAddresses);
userRouter.post("/addresses",authMiddleware,addAddress);
userRouter.put("/addresses/:id",authMiddleware,updateAddress);
userRouter.delete("/addresses/:id",authMiddleware,deleteAddress);
userRouter.post("/addresses/use/:id",authMiddleware,useAddress);

export default userRouter;