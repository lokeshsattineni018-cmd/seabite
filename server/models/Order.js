import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    houseNo: { type: String, required: true }, 
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
    orderId: { type: Number, unique: true },
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
        name: String,
        price: { type: Number, default: 0 },
        qty: { type: Number, default: 1 },
        image: String,
      },
    ],
    itemsPrice: { type: Number, default: 0 },    
    taxPrice: { type: Number, default: 0 },      
    shippingPrice: { type: Number, default: 0 }, 
    discount: { type: Number, default: 0 },      
    totalAmount: { type: Number, required: true }, 
    
    razorpay_order_id: { type: String, index: true }, 
    paymentMethod: { type: String, required: true, default: "COD" }, 
    
    paymentId: { type: String }, // Stores 'pay_...' ID for refunds
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    status: {
      type: String,
      default: "Pending",
    },
    // 🟢 FIXED: Default should be "None", not "Initiated"
    refundStatus: { 
      type: String, 
      default: "None" 
    },
    cancelReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function () {
  if (this.isNew && !this.orderId) { 
    const counter = await Counter.findOneAndUpdate(
      { name: "order" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderId = counter.seq + 999;
  }
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);