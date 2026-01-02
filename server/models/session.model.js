import pool from "../config/db.js";


export const createSession = async (session_name) => {
  const query = `
    INSERT INTO comm_sessions (session_name, is_active)
    VALUES ($1, false)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [session_name]);
  return rows[0];
};

export const getActiveSession = async () => {
  const result = await pool.query(
    'SELECT id, session_name FROM comm_sessions WHERE is_active = true LIMIT 1'
  );
  return result.rows[0];
};

// Get all sessions
export const getAllSessions = async () => {
  const query = `
    SELECT id, session_name, is_active
    FROM comm_sessions
    ORDER BY id
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// Activate a session (only one active)
export const activateSessionById = async (sessionId) => {
  await pool.query(`UPDATE comm_sessions SET is_active = false`);

  await pool.query(
    `UPDATE comm_sessions SET is_active = true WHERE id = $1`,
    [sessionId]
  );
};
export const cloneSessionWithQuestions = async (
  newSessionName,
  sourceSessionIds,
  questionCount
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Create new session
    const sessionResult = await client.query(
      `
      INSERT INTO comm_sessions (session_name, is_active)
      VALUES ($1, false)
      RETURNING id
      `,
      [newSessionName]
    );

    const newSessionId = sessionResult.rows[0].id;

    // 2️⃣ Fetch questions from selected sessions
    const questionsResult = await client.query(
      `
      SELECT question, option_a, option_b, option_c, option_d, correct_option
      FROM comm_questions
      WHERE session_id = ANY($1)
      `,
      [sourceSessionIds]
    );

    const allQuestions = questionsResult.rows;

    if (allQuestions.length < questionCount) {
      throw new Error("Not enough questions in selected sessions");
    }

    // 3️⃣ Shuffle questions
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const selectedQuestions = allQuestions.slice(0, questionCount);

    // 4️⃣ Insert questions into new session
    for (const q of selectedQuestions) {
      await client.query(
        `
        INSERT INTO comm_questions
          (session_id, question, option_a, option_b, option_c, option_d, correct_option)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          newSessionId,
          q.question,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option
        ]
      );
    }

    await client.query("COMMIT");

    return {
      session_id: newSessionId,
      questions_added: questionCount
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
