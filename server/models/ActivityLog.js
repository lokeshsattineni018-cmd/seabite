import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null }, // For tracking non-logged-in users
    action: { type: String, required: true }, // e.g., "LOGIN", "VIEW_PRODUCT", "ADD_TO_CART", "SEARCH"
    details: { type: String, default: "" }, // e.g., "Added Tiger Prawns", "Searched for 'Lobster'"
    meta: { type: Object, default: {} }, // Flexible payload for extra data (price, qty, etc.)
    timestamp: { type: Date, default: Date.now, expires: 7776000 } // Auto-delete after 90 days (7776000s) for historical auditing
});

// Index for rapid time-based queries
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
