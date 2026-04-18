import mongoose from "mongoose";

// ✅ This is the PERMANENT record kept in Alert History Tab 2
// NearbyAlert auto-deletes after 24hrs but this stays forever
// until user manually deletes it
const nearbyAlertHistorySchema = new mongoose.Schema(
  {
    // ✅ Original alert reference (may be deleted, keep basic info)
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      default: null,
    },

    // ✅ Who triggered the SOS
    victimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    victimGender: {
      type: String,
      enum: ["Female", "Male", "Other"],
      default: "Other",
    },

    // ✅ Who this history belongs to (the receiver/helper)
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Distance when alert was received
    distance: {
      type: Number,
      default: null,
    },

    // ✅ Area name (approximate)
    areaName: {
      type: String,
      default: "Nearby area",
    },

    // ✅ Exact location if anonymousMode was ON
    exactLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null },
      mapsLink: { type: String, default: null },
    },

    // ✅ Whether exact location was shared
    isExactLocation: {
      type: Boolean,
      default: false,
    },

    // ✅ Victim name if anonymousMode was ON
    victimName: {
      type: String,
      default: null,
    },

    // ✅ Alert type
    alertType: {
      type: String,
      default: "Panic Button",
    },

    // ✅ What action the receiver took
    helperAction: {
      type: String,
      enum: ["none", "called_police", "going_to_help", "seen"],
      default: "none",
    },

    // ✅ When the original alert was received
    receivedAt: {
      type: Date,
      required: true,
    },

    // ✅ No TTL - stays forever until user manually deletes
  },
  { timestamps: true },
);

// ✅ Indexes
nearbyAlertHistorySchema.index({ receiverId: 1, createdAt: -1 });
nearbyAlertHistorySchema.index({ victimId: 1 });

export default mongoose.model("NearbyAlertHistory", nearbyAlertHistorySchema);
