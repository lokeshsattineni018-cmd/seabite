import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  status: { type: String, enum: ["Active", "Inactive", "On Delivery"], default: "Active" },
  vehicleNumber: { type: String },
  vehicleType: { type: String, enum: ["Bike", "Scooter", "Cycle"], default: "Bike" },
  activeOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  completedOrdersCount: { type: Number, default: 0 },
  rating: { type: Number, default: 5 },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  lastLocationUpdate: { type: Date }
}, { timestamps: true });

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export default DeliveryPartner;
