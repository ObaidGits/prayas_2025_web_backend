import express from "express";
import { createSOS, getActiveAlerts, markAlertResolved, getAllAlerts } from "../controllers/websos.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User routes
router.post("/", verifyJWT, createSOS);

// Admin routes
router.get("/active", verifyJWT, getActiveAlerts);

router.put("/set-sos-resolved/:id", markAlertResolved);

router.get("/all-alerts", getAllAlerts);

export default router;