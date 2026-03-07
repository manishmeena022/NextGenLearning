import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { sendEmail } from "../utils/email.js";

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
};

// ── Helpers ───────────────────────────────────────────────
const createSession = (userId, refreshToken, req) =>
    Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        userAgent: req.headers["user-agent"] || null,
        ipAddress: req.ip || null,
    });

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const clearAuthCookie = (res) =>
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

// ═══════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already in use" });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = hashToken(rawToken);

        // Pre-save hook hashes password — don't bcrypt manually
        const user = await User.create({
            name,
            email,
            password,
            emailVerificationToken: hashedToken,
            emailVerificationExpiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS),
        });

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        await createSession(user._id, refreshToken, req);

        sendEmail({
            to: email,
            subject: "Verify your LearnFlow account",
            html: `<p>Hi ${name}, <a href="${process.env.CLIENT_URL}/verify-email?token=${rawToken}">verify your email</a>. Expires in 24h.</p>`,
        }).catch(err => console.error("Verification email failed:", err));

        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            message: "Account created. Please verify your email.",
            data: { accessToken, user: user.toSafeObject() },
        });
    } catch (error) {
        console.error("register error:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(e => ({ field: e.path, message: e.message }));
            return res.status(400).json({ success: false, errors });
        }
        res.status(500).json({ success: false, message: "Registration failed" });
    }
};

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmailForAuth(email);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (user.provider === "google") {
            return res.status(400).json({ success: false, message: "This account uses Google sign-in." });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: `Account banned${user.banReason ? `: ${user.banReason}` : ""}`,
            });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        await Session.deleteMany({ userId: user._id, expiresAt: { $lt: new Date() } });
        await createSession(user._id, refreshToken, req);
        await user.recordLogin();

        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: { accessToken, user: user.toSafeObject() },
        });
    } catch (error) {
        console.error("login error:", error);
        res.status(500).json({ success: false, message: "Login failed" });
    }
};

// ═══════════════════════════════════════════════════════════
// GOOGLE OAUTH CALLBACK
// ═══════════════════════════════════════════════════════════

export const googleCallback = async (req, res) => {
    try {
        const user = req.user;

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        await Session.deleteMany({ userId: user._id, expiresAt: { $lt: new Date() } });
        await createSession(user._id, refreshToken, req);
        await user.recordLogin();

        res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, sameSite: "lax" });

        const redirectUrl = new URL("/auth/callback", process.env.CLIENT_URL);
        redirectUrl.searchParams.set("token", accessToken);
        return res.redirect(redirectUrl.toString());
    } catch (error) {
        console.error("googleCallback error:", error);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }
};

// ═══════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════════════

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token" });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        }

        const session = await Session.findOne({ refreshToken, isRevoked: false });
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: "Session expired, please log in again" });
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive || user.isBanned) {
            return res.status(401).json({ success: false, message: "User not found or deactivated" });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);

        return res.status(200).json({
            success: true,
            data: { accessToken: newAccessToken },
        });
    } catch (error) {
        console.error("refresh error:", error);
        res.status(500).json({ success: false, message: "Failed to refresh token" });
    }
};

// ═══════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        clearAuthCookie(res);
        if (refreshToken) {
            await Session.deleteOne({ refreshToken }).catch(() => { });
        }
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("logout error:", error);
        res.status(500).json({ success: false, message: "Logout failed" });
    }
};

// ═══════════════════════════════════════════════════════════
// LOGOUT ALL DEVICES
// ═══════════════════════════════════════════════════════════

export const logoutAll = async (req, res) => {
    try {
        await Session.deleteMany({ userId: req.user.userId });
        clearAuthCookie(res);
        return res.status(200).json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
        console.error("logoutAll error:", error);
        res.status(500).json({ success: false, message: "Failed to logout all devices" });
    }
};

// ═══════════════════════════════════════════════════════════
// GET CURRENT USER
// ═══════════════════════════════════════════════════════════

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isBanned) return res.status(403).json({ success: false, message: "Account banned" });

        return res.json({ success: true, data: { user: user.toSafeObject() } });
    } catch (error) {
        console.error("getCurrentUser error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};

// ═══════════════════════════════════════════════════════════
// UPDATE PROFILE / ONBOARDING
// ═══════════════════════════════════════════════════════════

export const updateProfile = async (req, res) => {
    try {
        const { goal, level, subjects, dailyStudyTime } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                learningPreferences: {
                    goal, level, subjects,
                    dailyStudyTime: Number(dailyStudyTime),
                },
                isOnboarded: true,
                onboardedAt: new Date(),
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.json({
            success: true,
            message: "Profile updated successfully",
            data: { user: user.toSafeObject() },
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

// ═══════════════════════════════════════════════════════════
// VERIFY EMAIL
// ═══════════════════════════════════════════════════════════

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ success: false, message: "Verification token required" });
        }

        const user = await User.findOne({
            emailVerificationToken: hashToken(token),
            emailVerificationExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpiresAt = null;
        await user.save();

        return res.json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("verifyEmail error:", error);
        res.status(500).json({ success: false, message: "Email verification failed" });
    }
};

// ═══════════════════════════════════════════════════════════
// RESEND VERIFICATION EMAIL
// ═══════════════════════════════════════════════════════════

export const resendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }

        // Block resend if token is less than 5 minutes old
        const tokenAge = Date.now() - (
            user.emailVerificationExpiresAt
                ? user.emailVerificationExpiresAt - EMAIL_TOKEN_EXPIRY_MS
                : 0
        );
        if (tokenAge < 5 * 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: "Please wait 5 minutes before requesting another verification email",
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = hashToken(rawToken);
        user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS);
        await user.save();

        await sendEmail({
            to: user.email,
            subject: "Verify your LearnFlow account",
            html: `<p>Hi ${user.name}, <a href="${process.env.CLIENT_URL}/verify-email?token=${rawToken}">verify your email</a>. Expires in 24h.</p>`,
        });

        return res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
        console.error("resendVerificationEmail error:", error);
        res.status(500).json({ success: false, message: "Failed to send verification email" });
    }
};

// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Always return the same message — don't reveal whether email exists
        const SAFE_RESPONSE = {
            success: true,
            message: "If an account with that email exists, a reset link has been sent",
        };

        const user = await User.findOne({ email, provider: "local" });
        if (!user) return res.json(SAFE_RESPONSE);

        const rawToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = hashToken(rawToken);
        user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
        await user.save();

        await sendEmail({
            to: user.email,
            subject: "Reset your LearnFlow password",
            html: `<p>Hi ${user.name}, <a href="${process.env.CLIENT_URL}/reset-password?token=${rawToken}">reset your password</a>. Expires in 1 hour. If you didn't request this, ignore this email.</p>`,
        });

        return res.json(SAFE_RESPONSE);
    } catch (error) {
        console.error("forgotPassword error:", error);
        res.status(500).json({ success: false, message: "Failed to send reset email" });
    }
};

// ═══════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: "Token and new password are required" });
        }

        const user = await User.findOne({
            passwordResetToken: hashToken(token),
            passwordResetExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        user.password = password; // pre-save hook hashes it
        user.passwordResetToken = null;
        user.passwordResetExpiresAt = null;
        await user.save();

        // Force re-login on all devices after password change
        await Session.deleteMany({ userId: user._id });
        clearAuthCookie(res);

        return res.json({ success: true, message: "Password reset successfully. Please log in again." });
    } catch (error) {
        console.error("resetPassword error:", error);
        res.status(500).json({ success: false, message: "Failed to reset password" });
    }
};

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD  (authenticated)
// ═══════════════════════════════════════════════════════════

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current and new password are required" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: "New password must be different" });
        }

        const user = await User.findById(req.user.userId).select("+password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.provider === "google") {
            return res.status(400).json({ success: false, message: "Google accounts don't have a password" });
        }

        const valid = await user.comparePassword(currentPassword);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = newPassword; // pre-save hook hashes it
        await user.save();

        // Revoke all sessions except the current one
        const currentRefreshToken = req.cookies.refreshToken;
        await Session.deleteMany({
            userId: user._id,
            refreshToken: { $ne: currentRefreshToken },
        });

        return res.json({
            success: true,
            message: "Password changed. Other devices have been logged out.",
        });
    } catch (error) {
        console.error("changePassword error:", error);
        res.status(500).json({ success: false, message: "Failed to change password" });
    }
};

// ═══════════════════════════════════════════════════════════
// GET SESSIONS
// ═══════════════════════════════════════════════════════════

export const getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            userId: req.user.userId,
            expiresAt: { $gt: new Date() },
            isRevoked: false,
        }).sort({ createdAt: -1 });

        const currentToken = req.cookies.refreshToken;

        const formatted = sessions.map(s => ({
            id: s._id,
            userAgent: s.userAgent,
            ipAddress: s.ipAddress,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isCurrent: s.refreshToken === currentToken,
        }));

        return res.json({ success: true, data: { sessions: formatted } });
    } catch (error) {
        console.error("getSessions error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sessions" });
    }
};

// ═══════════════════════════════════════════════════════════
// REVOKE SPECIFIC SESSION
// ═══════════════════════════════════════════════════════════

export const revokeSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.sessionId,
            userId: req.user.userId, // users can only revoke their own
        });

        if (!session) return res.status(404).json({ success: false, message: "Session not found" });

        await session.deleteOne();

        return res.json({ success: true, message: "Session revoked" });
    } catch (error) {
        console.error("revokeSession error:", error);
        res.status(500).json({ success: false, message: "Failed to revoke session" });
    }
};

// ═══════════════════════════════════════════════════════════
// DELETE ACCOUNT
// ═══════════════════════════════════════════════════════════

export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.user.userId).select("+password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.provider === "local") {
            if (!password) {
                return res.status(400).json({ success: false, message: "Password required to delete account" });
            }
            const valid = await user.comparePassword(password);
            if (!valid) {
                return res.status(401).json({ success: false, message: "Incorrect password" });
            }
        }

        await Promise.all([
            User.findByIdAndDelete(req.user.userId),
            Session.deleteMany({ userId: req.user.userId }),
        ]);

        clearAuthCookie(res);

        return res.json({ success: true, message: "Account deleted" });
    } catch (error) {
        console.error("deleteAccount error:", error);
        res.status(500).json({ success: false, message: "Failed to delete account" });
    }
};