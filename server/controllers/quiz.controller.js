import pool from "../config/db.js";
import { hasAlreadyAttempted } from "../models/result.model.js";
import { saveResult } from "../models/result.model.js";
import { getActiveSession } from "../models/session.model.js";

import {
  getQuestionsBySession,
  updateQuestionById,
} from '../models/question.model.js';

export const fetchQuestions = async (req, res) => {
  try {
    const { sessionId } = req.query;
    let targetSession;

    if (sessionId) {
      // If sessionId is provided, we can just use it, 
      // but let's check if we want to return the session info too
      const sessionResult = await pool.query(
        "SELECT id, session_name FROM comm_sessions WHERE id = $1",
        [sessionId]
      );
      targetSession = sessionResult.rows[0];
    } else {
      targetSession = await getActiveSession();
    }

    if (!targetSession) {
      return res.status(400).json({
        success: false,
        message: sessionId ? 'Session not found' : 'No active session found'
      });
    }

    const questions = await getQuestionsBySession(targetSession.id);

    res.json({
      success: true,
      session: targetSession,
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
    const { answers = [], time_spent = [] } = req.body;


    console.log("SUBMIT QUIZ HIT");
console.log("USER:", req.user);
console.log("ANSWERS:", answers);


    const activeSession = await getActiveSession();
    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    const alreadyAttempted = await hasAlreadyAttempted(
      req.user.user_code,
      activeSession.id
    );

    if (alreadyAttempted) {
      return res.status(400).json({
        success: false,
        message: "You have already attempted this session",
      });
    }

    const questions = await getQuestionsBySession(activeSession.id);

    let correct = 0;
    let wrong = 0;
    for (let i = 0; i < questions.length; i++) {
      const selectedOption = answers[i] || null;
      const question = questions[i];
      const duration = time_spent[i] ?? null;
    
      const isCorrect =
        selectedOption &&
        selectedOption === question.correct_option;
    
      if (selectedOption) {
        if (isCorrect) correct++;
        else wrong++;
      }
    
      await pool.query(
        `
        INSERT INTO comm_answers
          (user_code, role, session_id, question_id, selected_option, is_correct, time_spent)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_code, session_id, question_id)
        DO NOTHING
        `,
        [
          req.user.user_code,
          req.user.role,
          activeSession.id,
          question.id,
          selectedOption,
          isCorrect,
          duration
        ]
      );
    }
    for (let i = 0; i < questions.length; i++) {
      const selectedOption = answers[i] || null;
      const question = questions[i];
      const duration = time_spent[i] ?? null;
    
      const isCorrect =
        selectedOption &&
        selectedOption === question.correct_option;
    
      if (selectedOption) {
        if (isCorrect) correct++;
        else wrong++;
      }
    
      await pool.query(
        `
        INSERT INTO comm_answers
          (user_code, role, session_id, question_id, selected_option, is_correct, time_spent)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_code, session_id, question_id)
        DO NOTHING
        `,
        [
          req.user.user_code,
          req.user.role,
          activeSession.id,
          question.id,
          selectedOption,
          isCorrect,
          duration
        ]
      );
    }
        

    const percentage = Math.round(
      (correct / questions.length) * 100
    );

    await saveResult({
      commissioner_name: req.user.user_code,
      session_id: activeSession.id,
      correct,
      wrong,
      percentage,
    });

    res.json({
      success: true,
      correct,
      wrong,
      percentage,
    });
  } catch (error) {
    console.error("SUBMIT QUIZ ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Quiz submission failed",
    });
  }
};

export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { question, option_a, option_b, option_c, option_d, correct_option } = req.body;

  try {
    const updated = await updateQuestionById(id, {
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE QUESTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
