import express from 'express';
import { listCustomers, setCustomerActive, stats, getSettings, updateSettings } from '../controllers/adminController.js';
import { chat } from '../controllers/botController.js';
import { adminAuth } from '../middleware/auth.js';

const adminRouter = express.Router();

// customer management
adminRouter.get("/customers", adminAuth, listCustomers);
adminRouter.post("/customer/active", adminAuth, setCustomerActive);
// dashboard counters
adminRouter.get("/stats", adminAuth, stats);
// AI helper chat
adminRouter.post("/bot", adminAuth, chat);
// shop switches (online payment on/off)
adminRouter.get("/settings", adminAuth, getSettings);
adminRouter.post("/settings", adminAuth, updateSettings);

export default adminRouter;
