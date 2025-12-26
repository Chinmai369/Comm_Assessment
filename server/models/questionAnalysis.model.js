import pool from "../config/db.js";

export const getQuestionAnalysisBySession = async (sessionId) => {
  const query = `
    SELECT
      q.id AS question_id,
      q.question AS question_text,
      q.correct_option,
      q.option_a, q.option_b, q.option_c, q.option_d,

      COUNT(a.id) FILTER (WHERE a.is_correct = true) AS correct_count,
      COUNT(a.id) FILTER (WHERE a.is_correct = false AND a.selected_option IS NOT NULL AND a.selected_option != '') AS wrong_count,
      COUNT(a.id) FILTER (WHERE a.selected_option IS NULL OR a.selected_option = '') AS skipped_count,

      COALESCE(
        json_agg(
          json_build_object(
            'commissioner_name', u.user_code,
            'ulb_name', u.ulb_name,
            'selected_option', a.selected_option,
            'is_correct', a.is_correct,
            'status', CASE WHEN a.selected_option IS NULL OR a.selected_option = '' THEN 'skipped' ELSE 'answered' END
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) AS responses

    FROM comm_questions q
    LEFT JOIN comm_answers a ON a.question_id = q.id AND a.session_id = q.session_id
    LEFT JOIN comm_users u ON a.user_code = u.user_code
    WHERE q.session_id = $1
    GROUP BY q.id, q.question, q.correct_option, q.option_a, q.option_b, q.option_c, q.option_d
    ORDER BY q.id;
  `;

  const { rows } = await pool.query(query, [sessionId]);
  return rows;
};
