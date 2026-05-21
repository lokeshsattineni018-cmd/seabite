import mongoose from "mongoose";

const groupCartSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      name: String,
      items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
          },
          qty: {
            type: Number,
            default: 1
          }
        }
      ]
    }
  ],
  status: {
    type: String,
    enum: ["open", "locked", "ordered"],
    default: "open"
  }
}, { timestamps: true });

export default mongoose.models.GroupCart || mongoose.model("GroupCart", groupCartSchema);
