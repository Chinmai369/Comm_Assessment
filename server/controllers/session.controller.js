import {
  getAllSessions,
  activateSessionById,
} from "../models/session.model.js";
import { createSession } from "../models/session.model.js";
import { cloneSessionWithQuestions } from "../models/session.model.js";

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

export const cloneSession = async (req, res) => {
  try {
    const { new_session_name, source_session_ids, question_count } = req.body;

    // 🔒 Basic validations
    if (!new_session_name || !new_session_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "New session name is required"
      });
    }

    if (
      !Array.isArray(source_session_ids) ||
      source_session_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one source session must be selected"
      });
    }

    if (!question_count || question_count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid question_count is required"
      });
    }

    // 🔁 Call model
    const result = await cloneSessionWithQuestions(
      new_session_name.trim(),
      source_session_ids,
      question_count
    );

    return res.json({
      success: true,
      message: "Session created successfully from existing sessions",
      session_id: result.session_id,
      questions_added: result.questions_added
    });
  } catch (error) {
    console.error("CLONE SESSION ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create session from existing"
    });
  }
};
