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

// update a question
export const updateQuestionById = async (id, { question, option_a, option_b, option_c, option_d, correct_option }) => {
  const result = await pool.query(
    `UPDATE comm_questions
     SET question = $1,
         option_a = $2,
         option_b = $3,
         option_c = $4,
         option_d = $5,
         correct_option = $6
     WHERE id = $7
     RETURNING *`,
    [question, option_a, option_b, option_c, option_d, correct_option, id]
  );
  return result.rows[0];
};
