import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://food-delivery-frontend-xi-vert.vercel.app',
        'https://food-del-admin-iota.vercel.app'
      ] 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

let dbConnected = false;

const ensureDbConnection = async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
};

app.use("/api", ensureDbConnection);

app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.use("/images", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API WORKING");
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}