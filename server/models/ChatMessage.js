import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      enum: ["user", "driver", "support", "admin"],
      required: true
    },
    recipientRole: {
      type: String,
      enum: ["user", "driver", "support", "admin"],
      required: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
