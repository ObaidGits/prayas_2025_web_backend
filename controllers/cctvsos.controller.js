import { broadcastNewAlert } from "../app.js";
import { CCTVSOSAlert } from "../models/cctvsos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from 'mongoose';

// Create SOS Alert (AI CCTV version)
// const createCCTVSOS = asyncHandler(async (req, res) => {
//   const { longitude, latitude, accuracy, sos_img } = req.body;

//   if (!longitude || !latitude) {
//     throw new ApiError(400, "Longitude and latitude are required");
//   }

//   const alert = await CCTVSOSAlert.create({
//     location: {
//       type: "Point",
//       coordinates: [longitude, latitude],
//       accuracy
//     },
//     sos_img
//   });

//   const createdsos = await CCTVSOSAlert.findById(alert._id);
//   if (!createdsos) {
//     throw new ApiError(500, "Something went wrong while sending location");
//   }

//   // Broadcast basic info (no user data)
//   broadcastNewAlert({
//     ...alert.toObject(),
//     userId: null,
//     source: "CCTV"
//   });

//   return res.status(201).json(new ApiResponse(200, "CCTV SOS submitted successfully"));
// });

const createCCTVSOS = asyncHandler(async (req, res) => {
  const { longitude, latitude, accuracy } = req.body;
  const sos_img = req.savedFileName; // from multer middleware

  if (!longitude || !latitude) {
    throw new ApiError(400, "Longitude and latitude are required");
  }

  if (!sos_img) {
    throw new ApiError(400, "SOS image not received");
  }

  const alert = await CCTVSOSAlert.create({
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
      accuracy
    },
    sos_img
  });

  const createdsos = await CCTVSOSAlert.findById(alert._id);
  if (!createdsos) {
    throw new ApiError(500, "Something went wrong while saving SOS alert");
  }

  broadcastNewAlert({
    ...alert.toObject(),
    userId: null,
    source: "CCTV"
  });

  return res.status(201).json(new ApiResponse(200, "CCTV SOS submitted successfully"));
});

// Admin: Get Active Alerts (includes CCTV alerts)
const getActiveCCTVAlerts = asyncHandler(async (req, res) => {
  const alerts = await CCTVSOSAlert.find({ status: "active" })
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, alerts));
});

// Admin: Get All Alerts
const getAllCCTVAlerts = asyncHandler(async (req, res) => {
  const alerts = await CCTVSOSAlert.find()
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, alerts));
});

// Mark CCTV alert resolved
const markCCTVAlertResolved = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid SOS alert ID' });
  }

  const updatedAlert = await CCTVSOSAlert.findByIdAndUpdate(
    id,
    { status: 'resolved' },
    { new: true }
  );

  if (!updatedAlert) {
    return res.status(404).json({ message: 'SOS alert not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'SOS alert marked as resolved',
    alert: updatedAlert
  });
});

export {
  createCCTVSOS,
  getActiveCCTVAlerts,
  getAllCCTVAlerts,
  markCCTVAlertResolved
};
