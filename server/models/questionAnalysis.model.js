import pool from "../config/db.js";

export const getQuestionAnalysisBySession = async (sessionId) => {
  const query = `
    SELECT
      q.id AS question_id,
      q.question AS question_text,

      COUNT(a.id) FILTER (WHERE a.is_correct = true) AS correct,
      COUNT(a.id) FILTER (WHERE a.is_correct = false) AS wrong,

      (
        (
          SELECT COUNT(*)
          FROM comm_users
          WHERE role IN ('commissioner','engineer')
            AND is_active = true
        )
        -
        COUNT(a.id)
      ) AS skipped

    FROM comm_questions q
    LEFT JOIN comm_answers a
      ON a.question_id = q.id
     AND a.session_id = q.session_id

    WHERE q.session_id = $1
    GROUP BY q.id, q.question
    ORDER BY q.id;
  `;

  const { rows } = await pool.query(query, [sessionId]);
  return rows;
};
