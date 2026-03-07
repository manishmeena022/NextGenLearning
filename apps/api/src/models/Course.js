import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        // ── Core ──────────────────────────────────────────
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [5, "Title must be at least 5 characters"],
            maxlength: [150, "Title must be less than 150 characters"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            // auto-generated from title before save (see middleware below)
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            minlength: [20, "Description must be at least 20 characters"],
            maxlength: [5000, "Description must be less than 5000 characters"],
        },
        shortDescription: {
            type: String,
            maxlength: [300, "Short description must be less than 300 characters"],
        },

        // ── Media ─────────────────────────────────────────
        thumbnail: {
            type: String,
            default: null,   // URL
        },
        previewVideoUrl: {
            type: String,
            default: null,
        },

        // ── Categorisation ────────────────────────────────
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            index: true,
        },
        subcategory: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        level: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "Level must be beginner, intermediate, or advanced",
            },
            required: [true, "Level is required"],
            index: true,
        },
        language: {
            type: String,
            default: "English",
            trim: true,
        },

        // ── Pricing ───────────────────────────────────────
        price: {
            type: Number,
            default: 0,
            min: [0, "Price cannot be negative"],
        },
        isFree: {
            type: Boolean,
            default: true,
        },
        currency: {
            type: String,
            default: "USD",
        },

        // ── Ownership ─────────────────────────────────────
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Course must have an instructor"],
            index: true,
        },

        // ── Status & visibility ───────────────────────────
        status: {
            type: String,
            enum: ["draft", "pending", "published", "rejected", "archived"],
            default: "draft",
            index: true,
        },
        rejectionReason: {
            type: String,
            default: null,
        },
        publishedAt: {
            type: Date,
            default: null,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },

        // ── Content structure ─────────────────────────────
        sections: [
            {
                title: { type: String, required: true, trim: true },
                order: { type: Number, default: 0 },
                lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
            },
        ],
        totalLessons: {
            type: Number,
            default: 0,
        },
        totalDuration: {
            type: Number,   // minutes
            default: 0,
        },

        // ── Requirements & outcomes ───────────────────────
        requirements: {
            type: [String],
            default: [],
        },
        outcomes: {
            type: [String],  // "What you'll learn"
            default: [],
        },
        targetAudience: {
            type: [String],
            default: [],
        },

        // ── Stats (denormalised for performance) ──────────
        enrolledCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Indexes ───────────────────────────────────────────────
courseSchema.index({ title: "text", description: "text", tags: "text" }); // full-text search
courseSchema.index({ status: 1, level: 1 });
courseSchema.index({ createdBy: 1, status: 1 });
courseSchema.index({ category: 1, level: 1, status: 1 });
courseSchema.index({ averageRating: -1, enrolledCount: -1 }); // popular courses sort

// ── Virtuals ──────────────────────────────────────────────
courseSchema.virtual("isPublished").get(function () {
    return this.status === "published";
});

courseSchema.virtual("durationText").get(function () {
    const h = Math.floor(this.totalDuration / 60);
    const m = this.totalDuration % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
});

// ── Middleware: auto-generate slug ────────────────────────
courseSchema.pre("save", async function (next) {
    if (!this.isModified("title")) return next();

    const base = this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    // Ensure uniqueness by appending a short ID if needed
    const existing = await mongoose.model("Course").findOne({
        slug: base,
        _id: { $ne: this._id },
    });

    this.slug = existing ? `${base}-${Date.now().toString(36)}` : base;

    // Sync isFree with price
    this.isFree = this.price === 0;

    next();
});

// ── Static: find published courses ───────────────────────
courseSchema.statics.findPublished = function (filter = {}) {
    return this.find({ ...filter, status: "published" });
};

export default mongoose.model("Course", courseSchema);