import { getQuestionAnalysisBySession } from "../models/questionAnalysis.model.js";

export const fetchQuestionAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const data = await getQuestionAnalysisBySession(sessionId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("QUESTION ANALYSIS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch question analysis",
    });
  }
};
