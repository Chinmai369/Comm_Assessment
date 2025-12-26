import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import quizRoutes from "./routes/quiz.routes.js";
import resultRoutes from "./routes/result.routes.js";
import sessionRoutes from "./routes/session.routes.js";

dotenv.config();   // 🔴 MUST BE FIRST



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/sessions', sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
