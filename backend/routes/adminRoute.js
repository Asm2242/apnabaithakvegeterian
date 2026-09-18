import express from 'express';
import { listCustomers, setCustomerActive, stats } from '../controllers/adminController.js';
import { adminAuth } from '../middleware/auth.js';

const adminRouter = express.Router();

// customer management
adminRouter.get("/customers", adminAuth, listCustomers);
adminRouter.post("/customer/active", adminAuth, setCustomerActive);
// dashboard counters
adminRouter.get("/stats", adminAuth, stats);

export default adminRouter;
