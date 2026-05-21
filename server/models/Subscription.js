import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      qty: {
        type: Number,
        required: true,
        default: 1
      },
      priceSnapshot: {
        type: Number,
        required: true
      }
    }
  ],
  frequency: {
    type: String,
    enum: ["weekly", "bi-weekly", "monthly"],
    required: true
  },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    houseNo: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "Wallet"],
    default: "COD"
  },
  status: {
    type: String,
    enum: ["active", "paused", "cancelled"],
    default: "active"
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  lastBillingDate: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
