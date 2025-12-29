import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";
import { createQuestion } from "../controllers/question.controller.js";

import {
  fetchQuestions,
  submitQuiz,
  updateQuestion
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/questions', fetchQuestions);
router.post("/submit", authenticate, submitQuiz);
router.put("/questions/:id", authenticate, authorizeRole("admin"), updateQuestion);
router.post(
  "/questions",
  authenticate,
  authorizeRole("admin"),
  createQuestion
);
export default router;
