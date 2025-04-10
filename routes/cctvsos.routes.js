import express from "express";
import {
  createCCTVSOS,
  getActiveCCTVAlerts,
  markCCTVAlertResolved,
  getAllCCTVAlerts
} from "../controllers/cctvsos.controller.js";
import { uploadCCTVSOS } from "../middlewares/cctvsos.multer.js";

const router = express.Router();

// CCTV creates SOS alert (no JWT needed)
router.post("/", uploadCCTVSOS.single("sos_img"), createCCTVSOS);

router.get("/active", getActiveCCTVAlerts);

router.put("/set-sos-resolved/:id", markCCTVAlertResolved);

router.get("/all-alerts", getAllCCTVAlerts);

export default router;
