import mongoose from "mongoose";

// ─── Expense Schema ───
const expenseSchema = new mongoose.Schema({
  category: { 
    type: String, 
    enum: ["cogs", "shipping", "packaging", "marketing", "salary", "rent", "utilities", "technology", "licenses", "insurance", "other"],
    required: true,
    index: true
  },
  subcategory: { type: String },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  
  // ── Receipt/Invoice ──
  receiptUrl: { type: String },
  invoiceNumber: { type: String },
  vendorName: { type: String },
  
  // ── Tax ──
  taxAmount: { type: Number, default: 0 },
  isDeductible: { type: Boolean, default: true },
  
  // ── Recurrence ──
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "yearly", null], default: null },
  
  // ── Metadata ──
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tags: [{ type: String }],
  notes: { type: String },
  
  // ── Multi-Store ──
  storeId: { type: String, default: "default" },
}, { timestamps: true });

expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ storeId: 1, date: -1 });

// ─── Tax Record Schema ───
const taxRecordSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  orderId: { type: Number },
  
  // ── GST Breakdown ──
  taxableAmount: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, required: true },
  taxRate: { type: Number, default: 5 }, // GST percentage
  
  // ── Invoice ──
  invoiceNumber: { type: String, unique: true, sparse: true },
  invoiceUrl: { type: String },
  invoiceDate: { type: Date, default: Date.now },
  
  // ── Customer ──
  customerName: { type: String },
  customerGSTIN: { type: String },
  
  // ── State ──
  billingState: { type: String },
  shippingState: { type: String },
  isInterState: { type: Boolean, default: false }, // IGST if true
  
  // ── Filing ──
  filingPeriod: { type: String }, // e.g., "2026-06" for June 2026
  isReconciled: { type: Boolean, default: false },
}, { timestamps: true });

taxRecordSchema.index({ filingPeriod: 1 });
taxRecordSchema.index({ invoiceDate: -1 });

// ─── Revenue Goal Schema ───
const revenueGoalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["revenue", "orders", "customers", "aov", "custom"],
    required: true 
  },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  
  period: { 
    type: String, 
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  progressPct: { type: Number, default: 0 },
  isAchieved: { type: Boolean, default: false },
  achievedAt: { type: Date },
  
  // ── Metadata ──
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  storeId: { type: String, default: "default" },
  notes: { type: String },
}, { timestamps: true });

revenueGoalSchema.index({ period: 1, startDate: -1 });

// ─── Payout Record (for multi-vendor) ───
const payoutRecordSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  vendorName: { type: String },
  
  amount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  netPayout: { type: Number, required: true },
  
  period: { type: String }, // e.g., "2026-06"
  status: { 
    type: String, 
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  },
  
  paymentMethod: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date },
  
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  orderCount: { type: Number, default: 0 },
}, { timestamps: true });

// Export all financial models
const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
const TaxRecord = mongoose.models.TaxRecord || mongoose.model("TaxRecord", taxRecordSchema);
const RevenueGoal = mongoose.models.RevenueGoal || mongoose.model("RevenueGoal", revenueGoalSchema);
const PayoutRecord = mongoose.models.PayoutRecord || mongoose.model("PayoutRecord", payoutRecordSchema);

export { Expense, TaxRecord, RevenueGoal, PayoutRecord };
export default Expense; // Default export for convenience
