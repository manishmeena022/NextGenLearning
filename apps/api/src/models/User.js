import mongoose from 'mongoose';
import bcrypt from "bcrypt"

const UserSchema = new mongoose.Schema({
    // ── Identity ──────────────────────────────────────
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [50, "Name must be less than 50 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
        index: true,
    },
    avatar: {
        type: String,
        default: null,   // URL — set from Google photo or upload
    },
    bio: {
        type: String,
        default: null,
        maxlength: [300, "Bio must be less than 300 characters"],
        trim: true,
    },
    headline: {
        type: String,
        default: null,   // e.g. "Senior Engineer at Stripe"
        maxlength: [120, "Headline must be less than 120 characters"],
        trim: true,
    },
    // ── Auth ──────────────────────────────────────────
    password: {
        type: String,
        required: function () { return this.provider === "local"; },
        select: false,    // never returned in queries by default
        minlength: [8, "Password must be at least 8 characters"],
    },
    provider: {
        type: String,
        enum: {
            values: ["local", "google"],
            message: "Provider must be local or google",
        },
        default: "local",
    },
    googleId: {
        type: String,
        default: null,
        index: true,
        sparse: true,     // only indexes non-null values
    },
    // ── Role & permissions ────────────────────────────
    role: {
        type: String,
        enum: {
            values: ["user", "teacher", "admin", "ai"],
            message: "Invalid role",
        },
        default: "user",
        index: true,
    },
    // ── Account status ────────────────────────────────
    isActive: {
        type: Boolean,
        default: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
        index: true,
    },
    banReason: {
        type: String,
        default: null,
    },
    bannedAt: {
        type: Date,
        default: null,
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    // ── Onboarding ────────────────────────────────────
    isOnboarded: {
        type: Boolean,
        default: false,
        index: true,
    },
    onboardedAt: {
        type: Date,
        default: null,
    },
    learningPreferences: {
        goal: {
            type: String,
            default: null,
            maxlength: [200, "Goal must be less than 200 characters"],
            trim: true,
        },
        level: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "Level must be beginner, intermediate or advanced",
            },
            default: null,
        },
        subjects: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 10,
                message: "Cannot have more than 10 subjects",
            },
        },
        dailyStudyTime: {
            type: Number,
            default: null,
            enum: {
                values: [15, 30, 60, 90, 120],
                message: "Daily study time must be 15, 30, 60, 90 or 120 minutes",
            },
        },
    },
    // ── Activity tracking ─────────────────────────────
    lastLoginAt: {
        type: Date,
        default: null,
    },
    lastActiveAt: {
        type: Date,
        default: null,
    },
    loginCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // ── Password reset ────────────────────────────────
    passwordResetToken: {
        type: String,
        default: null,
        select: false,
    },
    passwordResetExpiresAt: {
        type: Date,
        default: null,
        select: false,
    },

    // ── Email verification ────────────────────────────
    emailVerificationToken: {
        type: String,
        default: null,
        select: false,
    },
    emailVerificationExpiresAt: {
        type: Date,
        default: null,
        select: false,
    },

    // ── Notifications ─────────────────────────────────
    notificationPreferences: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
    },
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Indexes ───────────────────────────────────────────────
UserSchema.index({ email: 1, provider: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ isBanned: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// ── Virtuals ──────────────────────────────────────────────
UserSchema.virtual("isPasswordResetValid").get(function () {
    return (
        this.passwordResetToken &&
        this.passwordResetExpiresAt &&
        this.passwordResetExpiresAt > new Date()
    );
});

UserSchema.virtual("displayName").get(function () {
    return this.name || this.email.split("@")[0];
});

// ── Pre-save: hash password on change ────────────────────
UserSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance methods ──────────────────────────────────────

// Compare plain password against stored hash
UserSchema.methods.comparePassword = async function (plain) {
    if (!this.password) return false;
    return bcrypt.compare(plain, this.password);
};

// Safe version of the user to send to clients — no sensitive fields
UserSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpiresAt;
    delete obj.emailVerificationToken;
    delete obj.emailVerificationExpiresAt;
    delete obj.__v;
    return obj;
};

// Update login tracking — call after successful login
UserSchema.methods.recordLogin = async function () {
    this.lastLoginAt = new Date();
    this.lastActiveAt = new Date();
    this.loginCount += 1;
    return this.save();
};

// ── Static methods ────────────────────────────────────────

// Find active, non-banned user by email (includes password for auth)
UserSchema.statics.findByEmailForAuth = function (email) {
    return this.findOne({ email, isActive: true, isBanned: false })
        .select("+password");
};

export default mongoose.model("User", UserSchema);