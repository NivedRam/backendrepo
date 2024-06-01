import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js"
import newsRouter from "./routes/newsRoutes.js"
//App Config
dotenv.config();
const app = express();
const port = process.env.PORT || 8001;
mongoose.set("strictQuery", true);

app.use(express.json());
app.use(cors());

//db config
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // Added for completeness
    });
    console.log("db Connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit process with failure
  }
};

connectDB();


//api endpoints
app.use("/api/user", userRouter)
app.use("/api/news", newsRouter)


//listen
app.listen(port, () => console.log(`Listening on port ${port}`));
