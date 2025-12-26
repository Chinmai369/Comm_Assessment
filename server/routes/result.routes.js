import express from "express";
import { fetchQuestionAnalysis } from "../controllers/questionAnalysis.controller.js";
import { fetchResults } from "../controllers/result.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get('/', fetchResults);
router.get(
  "/question-analysis/:sessionId",
  authenticate,
  authorizeRoles("admin"),
  fetchQuestionAnalysis
);


export default router;
