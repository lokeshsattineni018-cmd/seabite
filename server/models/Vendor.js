import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  dockLocation: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 5
  },
  balance: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
