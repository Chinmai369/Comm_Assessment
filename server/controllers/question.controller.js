import { addQuestion } from "../models/question.model.js";

export const createQuestion = async (req, res) => {
  try {
    const {
      session_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option
    } = req.body;

    // Basic validation
    if (
      !session_id ||
      !question ||
      !option_a ||
      !option_b ||
      !option_c ||
      !option_d ||
      !correct_option
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!["A", "B", "C", "D"].includes(correct_option)) {
      return res.status(400).json({
        success: false,
        message: "Correct option must be A, B, C, or D"
      });
    }

    const newQuestion = await addQuestion({
      session_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option
    });

    res.json({
      success: true,
      question: newQuestion
    });
  } catch (error) {
    console.error("ADD QUESTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add question"
    });
  }
};
