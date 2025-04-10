import { broadcastNewAlert } from "../app.js";
import { SOSAlert } from "../models/websos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Create SOS Alert (Web version)
const createSOS = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { longitude, latitude, accuracy } = req.body;

  if (!longitude || !latitude) {
    throw new ApiError(400, "Longitude and latitude are required");
  }

  const alert = await SOSAlert.create({
    userId,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
      accuracy
    }
  });

  if (!alert) {
    throw new ApiError(500, "Something went wrong while saving SOS alert");
  }

  broadcastNewAlert({
    ...alert.toObject(),
    userId: {
      _id: req.user._id,
      email: req.user.email,
      contact: req.user.contact,
      avatar: req.user.avatar,
      fullName: req.user.fullName,
      age: req.user.age
    },
    source: "Web"
  });

  return res.status(201).json(new ApiResponse(201, "Web SOS alert submitted successfully"));
});

// Admin: Get Active Alerts (Web only)
const getActiveAlerts = asyncHandler(async (req, res) => {
  const alerts = await SOSAlert.find({ status: "active" })
    .populate("userId")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, alerts));
});

// Admin: Get All Alerts (Web only)
const getAllAlerts = asyncHandler(async (req, res) => {
  const alerts = await SOSAlert.find()
    .populate("userId")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, alerts));
});

// Admin: Mark Web Alert as Resolved
const markAlertResolved = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid SOS alert ID" });
  }

  const updatedAlert = await SOSAlert.findByIdAndUpdate(
    id,
    { status: "resolved" },
    { new: true }
  );

  if (!updatedAlert) {
    return res.status(404).json({ message: "SOS alert not found" });
  }

  return res.status(200).json({
    success: true,
    message: "Web SOS alert marked as resolved",
    alert: updatedAlert
  });
});

export {
  createSOS,
  getActiveAlerts,
  getAllAlerts,
  markAlertResolved
};
