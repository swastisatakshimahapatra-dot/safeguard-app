import mongoose from "mongoose";

const helperActionSchema = new mongoose.Schema(
  {
    // ✅ Which nearby alert this action is for
    nearbyAlertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NearbyAlert",
      required: true,
    },

    // ✅ Which original SOS alert
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
    },

    // ✅ Who helped
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Who was in danger
    victimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ What action they took
    action: {
      type: String,
      enum: ["called_police", "going_to_help", "seen"],
      required: true,
    },

    // ✅ Is helper currently sharing location with victim
    isLocationShared: {
      type: Boolean,
      default: false,
    },

    // ✅ When location sharing expires (30 min from action)
    locationExpiresAt: {
      type: Date,
      default: null,
    },

    // ✅ Last known helper location (updated via socket)
    helperLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },

    // ✅ Whether this help was confirmed resolved
    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ✅ Indexes for fast queries
helperActionSchema.index({ alertId: 1 });
helperActionSchema.index({ victimId: 1 });
helperActionSchema.index({ helperId: 1 });
helperActionSchema.index({ nearbyAlertId: 1 });

export default mongoose.model("HelperAction", helperActionSchema);
