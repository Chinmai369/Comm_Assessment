import {
  getAllSessions,
  activateSessionById,
} from "../models/session.model.js";

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

// POST activate session
export const activateSession = async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: "session_id is required",
    });
  }

  try {
    await activateSessionById(session_id);
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
