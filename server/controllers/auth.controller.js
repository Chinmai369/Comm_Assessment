import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { findUserForLogin } from "../models/aut.model.js";

export const login = async (req, res) => {
  const { role, user_code, ulb_name } = req.body;

  // Role is mandatory for everyone
  if (!role) {
    return res.status(400).json({
      success: false,
      message: "role is required",
    });
  }

  // Commissioner: ULB required, user_code OPTIONAL
  if (role === "commissioner" && !ulb_name) {
    return res.status(400).json({
      success: false,
      message: "ulb_name is required for commissioner",
    });
  }

  // Admin / Engineer: user_code REQUIRED
  if (role !== "commissioner" && !user_code) {
    return res.status(400).json({
      success: false,
      message: "user_code is required",
    });
  }

  try {
    let user;

    if (role === "commissioner" && !user_code) {
      // 🔹 AUTO-PICK commissioner based on ULB
      const result = await pool.query(
        `
        SELECT id, user_code, role, ulb_name
        FROM comm_users
        WHERE role = 'commissioner'
          AND ulb_name = $1
        LIMIT 1
        `,
        [ulb_name]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No commissioner found for selected ULB",
        });
      }

      user = result.rows[0];
    } else {
      // 🔹 Existing logic (admin / engineer / old flow)
      user = await findUserForLogin({ role, user_code, ulb_name });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid login details",
      });
    }

    // 🔐 JWT — UNCHANGED
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        user_code: user.user_code,
        ulb_name: user.ulb_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
