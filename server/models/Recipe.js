import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String }, // denormalized for display if product deleted
  weightGrams: { type: Number, required: true }, // grams needed for this recipe
  notes: { type: String, default: "" }, // e.g. "cleaned and deveined"
});

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    coverImage: { type: String },
    cookTimeMinutes: { type: Number, default: 30 },
    prepTimeMinutes: { type: Number, default: 15 },
    servings: { type: Number, default: 2 },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    cuisine: { type: String, default: "Coastal Indian" },
    tags: [{ type: String }], // e.g. ["grilled", "spicy", "prawn"]

    // 🛒 Ingredients linked to products
    ingredients: [ingredientSchema],

    // Additional non-seafood ingredients (text only)
    otherIngredients: [{ type: String }],

    // Step-by-step instructions
    steps: [{ type: String }],

    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
