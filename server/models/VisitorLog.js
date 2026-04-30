import mongoose from "mongoose";

const visitorLogSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  userId: { type: String, default: null },
  ipAddress: { type: String, required: true },
  currentPath: { type: String, required: true },
  city: { type: String, default: "Unknown" },
  lastActive: { type: Date, default: Date.now }
});

// Update the lastActive timestamp automatically before saving
visitorLogSchema.pre("save", function (next) {
  this.lastActive = new Date();
  next();
});

export default mongoose.model("VisitorLog", visitorLogSchema);
