import express from 'express';
import { loginUser, registerUser, getAddress, saveAddress, listAddresses, addAddress, updateAddress, deleteAddress, useAddress } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.get("/address",authMiddleware,getAddress);
userRouter.post("/address",authMiddleware,saveAddress);
// multiple addresses
userRouter.get("/addresses",authMiddleware,listAddresses);
userRouter.post("/addresses",authMiddleware,addAddress);
userRouter.put("/addresses/:id",authMiddleware,updateAddress);
userRouter.delete("/addresses/:id",authMiddleware,deleteAddress);
userRouter.post("/addresses/use/:id",authMiddleware,useAddress);

export default userRouter;