import express from 'express';
import { loginUser, registerUser, getAddress, saveAddress } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.get("/address",authMiddleware,getAddress);
userRouter.post("/address",authMiddleware,saveAddress);

export default userRouter;