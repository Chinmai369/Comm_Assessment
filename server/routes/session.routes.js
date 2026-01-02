import express from "express";
import {
  fetchSessions,
  activateSession,
} from "../controllers/session.controller.js";
import { addSession } from "../controllers/session.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";
import { cloneSession } from "../controllers/session.controller.js";

const router = express.Router();

router.get("/", fetchSessions);
router.post("/activate", activateSession);
router.post(
  "/",
  authenticate,
  authorizeRole("admin"),
  addSession
);
router.put(
  "/:id/activate",
  authenticate,
  authorizeRole("admin"),
  activateSession
);
router.post(
  "/clone",
  authenticate,
  authorizeRole("admin"),
  cloneSession
);


export default router;
