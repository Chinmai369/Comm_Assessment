import {
  getAllSessions,
  activateSessionById,
} from "../models/session.model.js";
import { createSession } from "../models/session.model.js";

export const addSession = async (req, res) => {
  try {
    const { session_name } = req.body;

    if (!session_name || !session_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Session name is required"
      });
    }

    const session = await createSession(session_name.trim());

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error("ADD SESSION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add session"
    });
  }
};

// GET all sessions
export const fetchSessions = async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("FETCH SESSIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
    });
  }
};
export const activateSession = async (req, res) => {
  try {
    const { id } = req.params;   // ✅ FROM URL

    await activateSessionById(id);

    res.json({
      success: true,
      message: "Session activated successfully",
    });
  } catch (error) {
    console.error("ACTIVATE SESSION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate session",
    });
  }
};

