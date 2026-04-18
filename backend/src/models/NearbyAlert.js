import mongoose from "mongoose";

const nearbyAlertSchema = new mongoose.Schema(
  {
    // ✅ Reference to the original Alert
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
    },

    // ✅ Who triggered the SOS
    victimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    victimGender: {
      type: String,
      enum: ["Female", "Male", "Other"],
      default: "Other",
    },

    // ✅ Who received this nearby alert
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Distance in km at time of alert
    distance: {
      type: Number,
      required: true,
    },

    // ✅ Approximate area name - NOT exact address
    areaName: {
      type: String,
      default: "Nearby area",
    },

    // ✅ Exact location - only sent if victim anonymousMode = ON
    exactLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null },
      mapsLink: { type: String, default: null },
    },

    // ✅ Whether exact location is shared
    // true = anonymousMode ON (name + exact location shared)
    // false = only gender + distance + area
    isExactLocation: {
      type: Boolean,
      default: false,
    },

    // ✅ Victim name - only if anonymousMode ON
    victimName: {
      type: String,
      default: null,
    },

    // ✅ Alert type
    alertType: {
      type: String,
      default: "Panic Button",
    },

    // ✅ Dashboard status
    // unseen = show in dashboard banner
    // seen = removed from dashboard, stays in alert history
    dashboardStatus: {
      type: String,
      enum: ["unseen", "seen"],
      default: "unseen",
    },

    // ✅ Helper action taken by receiver
    helperAction: {
      type: String,
      enum: ["none", "called_police", "going_to_help", "seen"],
      default: "none",
    },

    // ✅ When helper action was taken
    helperActionAt: {
      type: Date,
      default: null,
    },

    // ✅ Is helper sharing live location with victim
    isHelperLocationShared: {
      type: Boolean,
      default: false,
    },

    // ✅ When helper location sharing expires (30 min after "going_to_help")
    helperLocationExpiresAt: {
      type: Date,
      default: null,
    },

    // ✅ TTL index - auto delete from DB after 24 hours
    // This only deletes the NearbyAlert record
    // AlertHistory (separate) is kept forever until user manually deletes
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

// ✅ MongoDB TTL index - auto deletes document when expiresAt passes
nearbyAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ Index for fast queries
nearbyAlertSchema.index({ receiverId: 1, dashboardStatus: 1 });
nearbyAlertSchema.index({ victimId: 1 });
nearbyAlertSchema.index({ alertId: 1 });

export default mongoose.model("NearbyAlert", nearbyAlertSchema);
