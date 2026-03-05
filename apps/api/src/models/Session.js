import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
        select: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    userAgent: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null,
    },
    isRevoked: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

export default mongoose.model('Session', SessionSchema);