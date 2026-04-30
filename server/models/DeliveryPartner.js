import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true }, // For Rider PWA Login
  status: { type: String, enum: ["Active", "Offline", "Busy"], default: "Offline" },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rating: { type: Number, default: 5 },
  totalDeliveries: { type: Number, default: 0 },
  activeOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  vehicleType: { type: String, enum: ["Bike", "Scooter"], default: "Scooter" },
  payoutBalance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);
