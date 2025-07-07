import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect("mongodb://0.0.0.0:27017/Khana_Khazana")
    .then(() => console.log("DataBase Connected"));
};
