import { getResultsBySession } from "../models/result.model.js";
import { getActiveSession } from "../models/session.model.js";

export const fetchResults = async (req, res) => {
  try {
    const activeSession = await getActiveSession();

    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found'
      });
    }

    const results = await getResultsBySession(activeSession.id);

    res.json({
      success: true,
      session: {
        id: activeSession.id,
        name: activeSession.session_name
      },
      total_attempts: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
