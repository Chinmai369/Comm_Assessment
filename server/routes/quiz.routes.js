import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  fetchQuestions,
  submitQuiz,
  updateQuestion
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/questions', fetchQuestions);
router.post("/submit", authenticate, submitQuiz);
router.put("/questions/:id", authenticate, authorizeRoles("admin"), updateQuestion);

export default router;
