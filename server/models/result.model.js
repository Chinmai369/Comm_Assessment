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
        r.commissioner_name,
        u.role,
        u.ulb_name,
        r.correct_answers,
        r.wrong_answers,
        r.score_percentage,
        r.attempted_at,
        s.session_name
     FROM comm_results r
     LEFT JOIN comm_users u ON r.commissioner_name = u.user_code
     LEFT JOIN comm_sessions s ON r.session_id = s.id
     WHERE r.session_id = $1
     ORDER BY r.attempted_at DESC`,
    [sessionId]
  );

  return result.rows;
};
