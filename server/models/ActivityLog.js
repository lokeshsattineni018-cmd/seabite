import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null }, // For tracking non-logged-in users
    action: { type: String, required: true }, // e.g., "LOGIN", "VIEW_PRODUCT", "ADD_TO_CART", "SEARCH"
    details: { type: String, default: "" }, // e.g., "Added Tiger Prawns", "Searched for 'Lobster'"
    meta: { type: Object, default: {} }, // Flexible payload for extra data (price, qty, etc.)
    timestamp: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h to keep DB light
});

// Index for rapid time-based queries
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
