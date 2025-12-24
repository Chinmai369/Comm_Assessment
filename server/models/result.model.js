import pool from "../config/db.js";

// SAVE RESULT
export const saveResult = async ({
  commissioner_name,
  session_id,
  correct,
  wrong,
  percentage
}) => {
  await pool.query(
    `INSERT INTO comm_results
     (commissioner_name, session_id, correct_answers, wrong_answers, score_percentage)
     VALUES ($1, $2, $3, $4, $5)`,
    [commissioner_name, session_id, correct, wrong, percentage]
  );
};

// CHECK ALREADY ATTEMPTED
export const hasAlreadyAttempted = async (commissioner_name, session_id) => {
  const result = await pool.query(
    `SELECT 1
     FROM comm_results
     WHERE commissioner_name = $1
       AND session_id = $2
     LIMIT 1`,
    [commissioner_name, session_id]
  );

  return result.rowCount > 0;
};

// FETCH RESULTS (ADMIN)
export const getResultsBySession = async (sessionId) => {
  const result = await pool.query(
    `SELECT
        commissioner_name,
        correct_answers,
        wrong_answers,
        score_percentage,
        attempted_at
     FROM comm_results
     WHERE session_id = $1
     ORDER BY attempted_at DESC`,
    [sessionId]
  );

  return result.rows;
};
