import pool from "../config/db.js";

export const findUserForLogin = async ({ role, user_code, ulb_name }) => {
  const query = `
    SELECT 
      id,
      user_code,
      role,
      ulb_name,
      is_active
    FROM comm_users
    WHERE user_code = $1
      AND role = $2
      AND is_active = true
  `;

  const { rows } = await pool.query(query, [user_code, role]);
  return rows[0];
};
