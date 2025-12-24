import express from "express";
import { fetchResults } from "../controllers/result.controller.js";

const router = express.Router();

router.get('/', fetchResults);

export default router;
