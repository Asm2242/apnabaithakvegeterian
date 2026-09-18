import express from 'express';
import { addFood, listFood, removeFood, updateFood } from '../controllers/foodController.js';
import { adminAuth } from '../middleware/auth.js';
import multer from 'multer';
const foodRouter = express.Router();

//Image Storage Engine (Saving Image to uploads folder & rename it)

const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        return cb(null,`${Date.now()}${file.originalname}`);
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB per dish photo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files allowed"));
    }
})

foodRouter.get("/list",listFood);
foodRouter.post("/add",adminAuth,upload.single('image'),addFood);
foodRouter.post("/update",adminAuth,upload.single('image'),updateFood);
foodRouter.post("/remove",adminAuth,removeFood);

export default foodRouter;