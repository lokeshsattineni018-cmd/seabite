import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ["New", "Pending Reply", "Urgent", "Closed"], default: "New" },
  tags: [{ type: String }],
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Contact", contactSchema);