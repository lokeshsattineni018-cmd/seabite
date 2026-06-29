import mongoose from "mongoose";

// ─── Message in ticket thread ───
const ticketMessageSchema = new mongoose.Schema({
  sender: { 
    type: String, 
    enum: ["customer", "agent", "system"],
    required: true 
  },
  senderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String },
  content: { type: String, required: true },
  attachments: [{
    url: { type: String },
    filename: { type: String },
    type: { type: String } // image, pdf, etc.
  }],
  isInternal: { type: Boolean, default: false }, // Internal notes (not visible to customer)
  readByCustomer: { type: Boolean, default: false },
  readByAgent: { type: Boolean, default: false },
}, { timestamps: true });

// ─── SLA Tracking ───
const slaSchema = new mongoose.Schema({
  firstResponseDeadline: { type: Date },
  firstResponseAt: { type: Date },
  firstResponseBreached: { type: Boolean, default: false },
  resolutionDeadline: { type: Date },
  resolvedAt: { type: Date },
  resolutionBreached: { type: Boolean, default: false },
});

// ─── Counter for auto-increment ───
const ticketCounterSchema = new mongoose.Schema({
  name: { type: String, default: "ticket" },
  seq: { type: Number, default: 0 }
});
const TicketCounter = mongoose.models.TicketCounter || mongoose.model("TicketCounter", ticketCounterSchema);

// ─── Main Ticket Schema ───
const ticketSchema = new mongoose.Schema({
  ticketId: { type: Number, unique: true, index: true },
  
  // ── Customer ──
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userName: { type: String },
  userEmail: { type: String },

  // ── Related Entities ──
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  // ── Ticket Details ──
  subject: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["order", "product", "delivery", "payment", "refund", "account", "quality", "other"],
    default: "other",
    index: true
  },
  subcategory: { type: String },
  
  status: { 
    type: String, 
    enum: ["open", "in_progress", "waiting_on_customer", "waiting_on_internal", "resolved", "closed", "reopened"],
    default: "open",
    index: true
  },
  
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
    index: true
  },

  // ── Assignment ──
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedToName: { type: String },
  assignedAt: { type: Date },

  // ── Escalation ──
  escalationLevel: { type: Number, default: 0 }, // 0 = not escalated, 1 = L2, 2 = L3
  escalatedAt: { type: Date },
  escalationReason: { type: String },
  autoEscalated: { type: Boolean, default: false },

  // ── SLA ──
  sla: slaSchema,

  // ── Conversation Thread ──
  messages: [ticketMessageSchema],

  // ── Resolution ──
  resolution: { type: String },
  resolutionType: { 
    type: String, 
    enum: ["resolved", "refunded", "replaced", "explained", "escalated", "no_action_needed", null],
    default: null
  },

  // ── Customer Satisfaction ──
  csatScore: { type: Number, min: 1, max: 5 },
  csatFeedback: { type: String },
  csatSubmittedAt: { type: Date },

  // ── Metadata ──
  tags: [{ type: String }],
  source: { 
    type: String, 
    enum: ["web", "email", "chat", "phone", "whatsapp", "auto"],
    default: "web"
  },
  
  // ── Lifecycle ──
  firstResponseAt: { type: Date },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  reopenedAt: { type: Date },
  reopenCount: { type: Number, default: 0 },

}, { timestamps: true });

// ── Auto-increment ticket ID ──
ticketSchema.pre("save", async function() {
  if (this.isNew && !this.ticketId) {
    const counter = await TicketCounter.findOneAndUpdate(
      { name: "ticket" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.ticketId = 10000 + counter.seq; // Start from TKT-10001
  }
});

// ── Auto-set SLA deadlines ──
ticketSchema.pre("save", function() {
  if (this.isNew && !this.sla) {
    const slaHours = {
      critical: { firstResponse: 1, resolution: 4 },
      high: { firstResponse: 2, resolution: 8 },
      medium: { firstResponse: 4, resolution: 24 },
      low: { firstResponse: 8, resolution: 48 },
    };
    const config = slaHours[this.priority] || slaHours.medium;
    const now = new Date();
    this.sla = {
      firstResponseDeadline: new Date(now.getTime() + config.firstResponse * 60 * 60 * 1000),
      resolutionDeadline: new Date(now.getTime() + config.resolution * 60 * 60 * 1000),
    };
  }
});

// ── Indexes ──
ticketSchema.index({ status: 1, priority: -1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
