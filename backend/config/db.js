import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://0.0.0.0:27017/apna_baithak";
  await mongoose
    .connect(uri)
    .then(() => console.log("DataBase Connected"));
};
