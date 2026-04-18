import mongoose from "mongoose";

const familyAlertSchema = new mongoose.Schema(
  {
    // Who triggered the SOS
    triggeredBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      userName: String,
    },
    // Which family members should see this
    notifiedFamilyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    type: {
      type: String,
      default: "Panic Button",
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      mapsLink: String,
      available: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("FamilyAlert", familyAlertSchema);
