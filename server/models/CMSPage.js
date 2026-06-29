import mongoose from "mongoose";

// ─── Content Block (for page builder) ───
const contentBlockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["hero", "text", "image", "video", "cta", "features", "testimonials", "products", "faq", "newsletter", "html", "columns", "spacer"],
    required: true 
  },
  order: { type: Number, default: 0 },
  content: { type: mongoose.Schema.Types.Mixed }, // Flexible content per block type
  styles: { type: mongoose.Schema.Types.Mixed }, // Custom styles
  isVisible: { type: Boolean, default: true },
});

// ─── SEO Configuration ───
const seoSchema = new mongoose.Schema({
  title: { type: String, maxLength: 70 },
  description: { type: String, maxLength: 160 },
  keywords: [{ type: String }],
  ogImage: { type: String },
  ogTitle: { type: String },
  ogDescription: { type: String },
  canonicalUrl: { type: String },
  noIndex: { type: Boolean, default: false },
  structuredData: { type: mongoose.Schema.Types.Mixed }, // JSON-LD
});

// ─── Version History ───
const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  content: { type: mongoose.Schema.Types.Mixed },
  blocks: [contentBlockSchema],
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  savedAt: { type: Date, default: Date.now },
  changeDescription: { type: String },
});

// ─── Main CMS Page Schema ───
const cmsPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  
  type: { 
    type: String, 
    enum: ["page", "landing", "blog_post", "email_template", "help_article"],
    required: true,
    index: true
  },

  // ── Content ──
  content: { type: mongoose.Schema.Types.Mixed }, // Rich text JSON (TipTap format)
  contentHtml: { type: String }, // Pre-rendered HTML for fast serving
  excerpt: { type: String, maxLength: 300 },
  
  // ── Page Builder Blocks ──
  blocks: [contentBlockSchema],
  isPageBuilder: { type: Boolean, default: false }, // true = use blocks, false = use content

  // ── SEO ──
  seo: seoSchema,

  // ── Media ──
  featuredImage: { type: String },
  gallery: [{ type: String }],

  // ── Categorization ──
  category: { type: String },
  tags: [{ type: String }],

  // ── Publishing ──
  status: { 
    type: String, 
    enum: ["draft", "published", "scheduled", "archived"],
    default: "draft",
    index: true
  },
  publishAt: { type: Date },
  publishedAt: { type: Date },
  unpublishedAt: { type: Date },

  // ── Authorship ──
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorName: { type: String },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // ── Versioning ──
  currentVersion: { type: Number, default: 1 },
  versions: [versionSchema],

  // ── Email Template Specific ──
  emailSubject: { type: String },
  emailPreheader: { type: String },
  emailCategory: { 
    type: String, 
    enum: ["transactional", "marketing", "notification", "system", null],
    default: null
  },

  // ── Help Article Specific ──
  helpCategory: { type: String },
  helpOrder: { type: Number, default: 0 }, // Sort order in KB
  isPublic: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  helpfulYes: { type: Number, default: 0 },
  helpfulNo: { type: Number, default: 0 },

  // ── Analytics ──
  pageViews: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },

  // ── Multi-Store ──
  storeId: { type: String, default: "default" },

}, { timestamps: true });

// ── Auto-generate slug ──
cmsPageSchema.pre("save", function(next) {
  if (this.isModified("title") && (!this.slug || this.isNew)) {
    this.slug = this.title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
  next();
});

// ── Indexes ──
cmsPageSchema.index({ type: 1, status: 1, publishedAt: -1 });
cmsPageSchema.index({ slug: 1, storeId: 1 });
cmsPageSchema.index({ tags: 1 });

export default mongoose.models.CMSPage || mongoose.model("CMSPage", cmsPageSchema);
