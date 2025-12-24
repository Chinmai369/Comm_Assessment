import { hasAlreadyAttempted } from "../models/result.model.js";
import { saveResult } from "../models/result.model.js";
import { getActiveSession } from "../models/session.model.js";

import {
  getQuestionsBySession,
  getCorrectAnswersBySession
} from '../models/question.model.js';

export const fetchQuestions = async (req, res) => {
  try {
    const activeSession = await getActiveSession();

    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found'
      });
    }

    const questions = await getQuestionsBySession(activeSession.id);

    res.json({
      success: true,
      session: activeSession,
      questions: questions.map(q => ({
    id: q.id,
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_option: q.correct_option 
}))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { commissioner_name, answers } = req.body;

    const activeSession = await getActiveSession();
    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found'
      });
    }
        const alreadyAttempted = await hasAlreadyAttempted(
      commissioner_name,
      activeSession.id
    );

    if (alreadyAttempted) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this session'
      });
    }


    const correctAnswers = await getCorrectAnswersBySession(activeSession.id);

    let correct = 0;
    correctAnswers.forEach((q, index) => {
      if (answers[index] === q.correct_option) correct++;
    });

    const wrong = correctAnswers.length - correct;
    const percentage = (correct / correctAnswers.length) * 100;

    await saveResult({
      commissioner_name,
      session_id: activeSession.id,
      correct,
      wrong,
      percentage
    });

    res.json({
      success: true,
      session: activeSession.session_name,
      correct,
      wrong,
      percentage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
