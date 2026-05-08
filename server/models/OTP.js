import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["SIGNUP", "FORGOT"], required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: 600 } } // Expires after 10 minutes
});

export default mongoose.model("OTP", otpSchema);
