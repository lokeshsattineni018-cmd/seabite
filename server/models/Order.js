import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  houseNo: { type: String, default: "" },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
});

const counterSchema = new mongoose.Schema({
  name: String,
  seq: Number,
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: Number, unique: true }, // Used in Resend Emails
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
        buyingPrice: { type: Number, default: 0 }, // 🟢 NEW: Snapshot of Cost Price
        qty: { type: Number, default: 1 }, // Used for Top Selling aggregation
        image: { type: String, required: true }, // Required for Dashboard thumbnails
        // ⚖️ Weight Variance Guarantee
        orderedWeightGrams: { type: Number, default: 0 }, // Weight customer selected
        actualWeightGrams: { type: Number, default: 0 }, // Weight admin confirms on pack
        selectedCut: { type: String, default: "" }, // e.g. "Fillets"
        cutPriceAdjustmentPct: { type: Number, default: 0 },
      },
    ],
    itemsPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Used for Dashboard Revenue stats

    razorpay_order_id: { type: String, index: true },
    paymentMethod: { type: String, required: true, default: "COD" },

    paymentId: { type: String },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // 🟢 ADDED: Tracking for better dashboard intelligence
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    status: {
      type: String,
      default: "Pending", // Options: Pending, Processing, Packed, Shipped, Out for Delivery, Delivered, Cancelled
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        message: { type: String }
      }
    ],
    refundStatus: {
      type: String,
      default: "None"
    },
    cancelReason: {
      type: String,
      default: "",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner"
    },
    deliveryStatus: {
      type: String,
      enum: ["Unassigned", "Assigned", "Picked Up", "Arriving", "Delivered", "Failed"],
      default: "Unassigned"
    },
    // 🐟 Premium Quality Feedback
    qualityConfirmed: { type: Boolean, default: false },
    qualityConfirmedAt: { type: Date },
    // 🔐 Enterprise Idempotency (Prevent Duplicate Orders)
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    // 🛡️ Fraud Protection
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    walletAppliedAmount: { type: Number, default: 0 },
    fraudFingerprint: { type: String, index: true },

    // 🕒 Scheduled Slot Delivery & Gifting
    deliverySlot: { type: String },
    deliveryDate: { type: Date },
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String },

    // ⚖️ Weight Variance Guarantee
    weightVarianceRefundIssued: { type: Boolean, default: false },
    weightVarianceRefundAmount: { type: Number, default: 0 },

    // 📝 Order Modification (Enterprise)
    modificationWindow: { type: Date }, // Timestamp until modification allowed
    modifications: [{
      modifiedAt: { type: Date, default: Date.now },
      modifiedBy: { type: String }, // 'customer' or 'admin'
      changes: { type: mongoose.Schema.Types.Mixed }, // What was changed
      reason: { type: String }
    }],
    isModifiable: { type: Boolean, default: true },

    // ✂️ Split Orders
    splitOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isSplitChild: { type: Boolean, default: false },

    // 📸 Delivery Proof
    deliveryProof: {
      photoUrl: { type: String },
      gpsLat: { type: Number },
      gpsLng: { type: Number },
      capturedAt: { type: Date },
      signature: { type: String } // base64 signature image
    },

    // ⏱️ Smart ETA
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    etaUpdates: [{
      eta: { type: Date },
      updatedAt: { type: Date, default: Date.now },
      reason: { type: String }
    }],

    // 🎁 Gift Wrapping (per-item)
    giftWrapping: [{
      itemIndex: { type: Number },
      wrapType: { type: String, default: 'standard' },
      message: { type: String },
      recipientName: { type: String },
      price: { type: Number, default: 0 }
    }],

    // 🏢 Warehouse / Multi-location
    assignedWarehouse: { type: String, default: 'main' },
    warehouseAssignedAt: { type: Date },

    // ⚙️ Custom Statuses & Workflows
    customStatus: { type: String },
    workflowLogs: [{
      workflowName: { type: String },
      action: { type: String },
      executedAt: { type: Date, default: Date.now },
      success: { type: Boolean, default: true },
      details: { type: String }
    }],

    // 📊 NPS & Feedback
    npsScore: { type: Number, min: 0, max: 10 },
    npsFeedback: { type: String },
    npsSubmittedAt: { type: Date },

    // 📦 Return/Refund Workflow
    returnRequest: {
      status: { type: String, enum: ['none', 'requested', 'approved', 'rejected', 'picked_up', 'received', 'refunded'], default: 'none' },
      reason: { type: String },
      requestedAt: { type: Date },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      refundAmount: { type: Number, default: 0 },
      refundMethod: { type: String, enum: ['wallet', 'original', 'bank_transfer', null], default: null },
      refundedAt: { type: Date },
      images: [{ type: String }], // Customer uploads
      adminNotes: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-increment logic for Order ID
orderSchema.pre("save", async function () {
  if (this.isNew && !this.orderId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "order" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.orderId = counter.seq + 999;
  }
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);