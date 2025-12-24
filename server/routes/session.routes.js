import express from "express";
import {
  fetchSessions,
  activateSession,
} from "../controllers/session.controller.js";

const router = express.Router();

router.get("/", fetchSessions);
router.post("/activate", activateSession);

export default router;
