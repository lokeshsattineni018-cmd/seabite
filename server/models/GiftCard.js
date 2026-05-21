import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  initialBalance: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  active: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.models.GiftCard || mongoose.model("GiftCard", giftCardSchema);
