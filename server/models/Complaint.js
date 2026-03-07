import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        issueType: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Resolved"],
            default: "Pending",
        },
        adminReply: {
            type: String,
            default: "",
        },
        repliedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
export default Complaint;
