import mongoose from "mongoose";

const frustrationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  guestId: {
    type: String,
    default: null
  },
  email: String,
  type: {
    type: String,
    enum: ["COUPON_ABUSE", "HOVER_STALL", "TIME_STALL"],
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ["LOGGED", "RESCUED", "IGNORED"],
    default: "LOGGED"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// TTL index to auto-delete after 7 days
frustrationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

const FrustrationLog = mongoose.model("FrustrationLog", frustrationLogSchema);
export default FrustrationLog;
