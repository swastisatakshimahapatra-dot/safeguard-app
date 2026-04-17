import mongoose from "mongoose";

const linkRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromUserName: String,
    fromUserEmail: String,
    relation: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "denied"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("LinkRequest", linkRequestSchema);
