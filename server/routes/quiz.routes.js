import express from "express";

import {
  fetchQuestions,
  submitQuiz
} from '../controllers/quiz.controller.js';

const router = express.Router();

router.get('/questions', fetchQuestions);
router.post('/submit', submitQuiz);

export default router;
