import mongoose from "mongoose";

const searchInsightSchema = new mongoose.Schema({
    query: { type: String, required: true, lowercase: true, trim: true },
    count: { type: Number, default: 1 },
    found: { type: Boolean, default: true },
    lastSearched: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for quick lookups and uniqueness
searchInsightSchema.index({ query: 1 });

const SearchInsight = mongoose.model("SearchInsight", searchInsightSchema);
export default SearchInsight;
