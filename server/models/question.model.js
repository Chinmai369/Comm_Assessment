import pool from "../config/db.js";

// fetch questions for active session (WITH correct answer for display)
export const getQuestionsBySession = async (sessionId) => {
  const result = await pool.query(
    `SELECT id, question, option_a, option_b, option_c, option_d, correct_option
     FROM comm_questions
     WHERE session_id = $1
     ORDER BY id`,
    [sessionId]
  );
  return result.rows;
};

// fetch correct answers for scoring
export const getCorrectAnswersBySession = async (sessionId) => {
  const result = await pool.query(
    `SELECT id, correct_option
     FROM comm_questions
     WHERE session_id = $1
     ORDER BY id`,
    [sessionId]
  );
  return result.rows;
};
