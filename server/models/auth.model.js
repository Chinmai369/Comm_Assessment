import pool from "../config/db.js";

export const findUserForLogin = async ({ role, user_code, ulb_name }) => {
  let query = `
    SELECT id, user_code, role, ulb_name
    FROM comm_users
    WHERE user_code = $1
      AND role = $2
      AND is_active = true
  `;

  const params = [user_code, role];

  if (role === "commissioner") {
    query += ` AND ulb_name = $3`;
    params.push(ulb_name);
  }
console.log("login query params:", params);
  const { rows } = await pool.query(query, params);
  return rows[0];
};
