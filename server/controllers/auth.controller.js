import jwt from "jsonwebtoken";
import { findUserForLogin } from "../models/aut.model.js";

export const login = async (req, res) => {
  const { role, user_code, ulb_name } = req.body;

  if (!role || !user_code) {
    return res.status(400).json({
      success: false,
      message: "role and user_code are required",
    });
  }

  if (role === "commissioner" && !ulb_name) {
    return res.status(400).json({
      success: false,
      message: "ulb_name is required for commissioner",
    });
  }

  try {
    const user = await findUserForLogin({ role, user_code, ulb_name });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid login details",
      });
    }

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

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
