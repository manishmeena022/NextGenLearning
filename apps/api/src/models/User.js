import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Invalid email format']
    },
    password: {
        type: String,
        required: function () {
            return this.provider === 'local';
        },
        select: false,
        minLength: 8,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'teacher', 'ai'],
        default: 'user'
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    googleId: {
        type: String,
        default: null,
        index: true,
        sparse: true,
    },
    learningPreferences: {
        level: String,
        subjects: [String],
        goal: String,
        dailyStudyTime: Number
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
}, { timestamps: true });


UserSchema.index({ email: 1, provider: 1 });

export default mongoose.model('User', UserSchema);