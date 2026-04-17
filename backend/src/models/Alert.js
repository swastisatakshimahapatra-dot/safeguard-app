import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Panic Button",
        "Voice Detection",
        "Motion Detection",
        "Location Shared",
        "Crime Zone",
      ],
      default: "Panic Button",
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String, // ✅ Place name
      mapsLink: String, // ✅ Google Maps URL
    },
    contactsNotified: [
      {
        name: String,
        phone: String,
        email: String,
        smsSent: {
          type: Boolean,
          default: false,
        },
        smsError: String,
        whatsappSent: {
          type: Boolean,
          default: false,
        },
        whatsappError: String,
        emailSent: {
          type: Boolean,
          default: false,
        },
        emailError: String,
      },
    ],
    status: {
      type: String,
      enum: ["Sent", "Failed", "Partial"],
      default: "Sent",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Alert", alertSchema);
