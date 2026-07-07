import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true }, // For Rider PWA Login
  status: { type: String, enum: ["Active", "Offline", "Busy", "On Delivery"], default: "Offline" },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rating: { type: Number, default: 5 },
  totalDeliveries: { type: Number, default: 0 },
  activeOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  vehicleType: { type: String, enum: ["Bike", "Scooter"], default: "Scooter" },
  payoutBalance: { type: Number, default: 0 },

  // ── Gamification: Streak & Achievements ──
  streak: { type: Number, default: 0 },
  lastDeliveryDate: { type: Date },
  achievements: [{ 
    badge: { type: String },      // e.g. "rain_warrior", "night_captain", "century"
    unlockedAt: { type: Date, default: Date.now }
  }],

  // ── Safety: Fatigue & SOS ──
  onlineStartedAt: { type: Date },       // When driver last toggled online
  totalOnlineMinutesToday: { type: Number, default: 0 },
  sosHistory: [{
    lat: { type: Number },
    lng: { type: Number },
    triggeredAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],

  // ── Vehicle Inspection ──
  inspectionLog: [{
    date: { type: Date },
    items: { type: mongoose.Schema.Types.Mixed },   // { tires: true, lights: true, iceBox: true, documents: true }
    passed: { type: Boolean, default: false }
  }],

  // ── Daily Earnings Breakdown ──
  dailyEarnings: [{
    date: { type: Date },
    base: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    surge: { type: Number, default: 0 },
    fuel: { type: Number, default: 0 },
    deliveries: { type: Number, default: 0 }
  }],

  // ── On-Time Performance ──
  onTimeDeliveries: { type: Number, default: 0 },
  lateDeliveries: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);
