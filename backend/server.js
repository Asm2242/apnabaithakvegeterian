import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import otpRouter from "./routes/otpRoute.js";
import riderRouter from "./routes/riderRoute.js";
import adminRouter from "./routes/adminRoute.js";
import couponRouter from "./routes/couponRoute.js";
import feedbackRouter from "./routes/feedbackRoute.js";
import reviewRouter from "./routes/reviewRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

// middlewares
app.use(express.json());

// CORS: known origins only. Production domains are always allowed so a
// missing CORS_ORIGINS env var can never take the live site offline.
// Requests without an Origin header (curl, server-to-server, mobile apps) pass.
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://apnabaithak.com",
  "https://www.apnabaithak.com",
  "https://admin.apnabaithak.com",
  "https://rider.apnabaithak.com",
  "https://apnabaithakvegeterian.vercel.app",
  "https://apna-baithak-veg-restaurant.vercel.app",
];
const allowedOrigins = [
  ...DEFAULT_ORIGINS,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// db connection
connectDB();

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/otp", otpRouter);
app.use("/api/rider", riderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/review", reviewRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);
