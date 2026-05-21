import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: "SeaBite Chef"
  },
  image: {
    type: String
  },
  readTime: {
    type: Number,
    default: 5
  },
  tags: [String],
  productsAssociated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
}, { timestamps: true });

export default mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
