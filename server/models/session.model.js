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
