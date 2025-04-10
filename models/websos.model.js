import mongoose from "mongoose";

const webSosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
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
  }
});

export const SOSAlert = mongoose.model("web_sos_alert", webSosAlertSchema);