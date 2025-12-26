import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  fetchQuestions,
  submitQuiz
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/questions', fetchQuestions);
router.post("/submit", authenticate, submitQuiz);

export default router;
