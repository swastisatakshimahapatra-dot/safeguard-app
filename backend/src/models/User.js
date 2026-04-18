import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  relation: { type: String, trim: true },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    gender: {
      type: String,
      enum: ["Female", "Male", "Other"],
      default: "Other",
    },
    role: {
      type: String,
      enum: ["user", "family", "admin"],
      default: "user",
    },
    emergencyContacts: [emergencyContactSchema],
    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
      default: null,
    },
    emailVerifyExpires: {
      type: Date,
      default: null,
    },

    linkedUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        relation: String,
      },
    ],
    settings: {
      notifications: {
        emailAlerts: { type: Boolean, default: true },
        whatsappAlerts: { type: Boolean, default: true },
        crimeZoneAlerts: { type: Boolean, default: true },
        communityAlerts: { type: Boolean, default: true },
      },
      privacy: {
        shareLocationFamily: { type: Boolean, default: true },
        shareLocationCommunity: { type: Boolean, default: false },
        anonymousMode: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
