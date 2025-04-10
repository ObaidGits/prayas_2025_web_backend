import mongoose from "mongoose";

const cctvSosAlertSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"]
    },
    coordinates: {
      type: [Number],
      required: true
    },
    accuracy: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "resolved"],
    default: "active"
  },
  sos_img:{
    type: String
  }
});

export const CCTVSOSAlert = mongoose.model("cctv_sos_alert", cctvSosAlertSchema);