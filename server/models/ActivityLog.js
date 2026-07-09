import mongoose from "mongoose";
import crypto from "crypto";

const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null }, // For tracking non-logged-in users
    action: { type: String, required: true }, // e.g., "LOGIN", "VIEW_PRODUCT", "ADD_TO_CART", "SEARCH"
    details: { type: String, default: "" }, // e.g., "Added Tiger Prawns", "Searched for 'Lobster'"
    meta: { type: Object, default: {} }, // Flexible payload for extra data (price, qty, etc.)
    timestamp: { type: Date, default: Date.now, expires: 7776000 }, // Auto-delete after 90 days
    hash: { type: String, default: "" },
    previousHash: { type: String, default: "" }
});

// Index for rapid time-based queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1, action: 1, timestamp: -1 });
activityLogSchema.index({ user: 1, timestamp: -1 });

// Cryptographic Sequential SHA-256 Blockhashing pre-save hook
activityLogSchema.pre("save", async function () {
    if (!this.hash) {
        // Find the last activity log document
        const lastLog = await mongoose.model("ActivityLog")
            .findOne()
            .sort({ timestamp: -1, _id: -1 });

        this.previousHash = lastLog && lastLog.hash 
            ? lastLog.hash 
            : "0000000000000000000000000000000000000000000000000000000000000000";

        // hash = sha256(previousHash + action + timestamp)
        const timeStr = this.timestamp instanceof Date ? this.timestamp.toISOString() : new Date(this.timestamp).toISOString();
        const dataToHash = this.previousHash + this.action + timeStr;
        this.hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
    }
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
