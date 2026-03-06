import User from "../models/User.js";
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";
import Session from "../models/Session.js";

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// User registration
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password: hashedPassword });

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip || null,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
        });

        return res.status(201).json({ accessToken, refreshToken });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            message: process.env.NODE_ENV === 'production'
                ? "Internal server error"
                : error.message
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Guard against OAuth users trying to use password login
        if (user.provider === 'google') {
            return res.status(400).json({ message: "This account uses Google sign-in" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Clear old sessions before creating a new one
        await Session.deleteMany({ userId: user._id });

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip || null,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
        });

        return res.status(200).json({ accessToken });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: process.env.NODE_ENV === 'production'
                ? "Internal server error"
                : error.message
        });
    }
};

const googleCallback = async (req, res) => {
    try {
        const accessToken = generateAccessToken(req.user._id, req.user.role);
        const refreshToken = generateRefreshToken(req.user._id);

        await Session.deleteMany({ userId: req.user._id });

        await Session.create({
            userId: req.user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip || null,
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
        });

        return res.status(200).json({ accessToken });

    } catch (error) {
        console.error("Google callback error:", error);
        return res.status(500).json({
            message: process.env.NODE_ENV === 'production'
                ? "Internal server error"
                : error.message
        });
    }
}

// Refresh token controller
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const session = await Session.findOne({ refreshToken, isRevoked: false });
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired, please login again" });
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: "User not found or deactivated" });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);

        return res.status(200).json({ accessToken: newAccessToken });

    } catch (error) {
        console.error("Refresh error:", error);
        return res.status(500).json({
            message: process.env.NODE_ENV === 'production'
                ? "Internal server error"
                : error.message
        });
    }
};

// User logout
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }

        // Verify token is legitimate before touching the DB
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const result = await Session.deleteOne({ refreshToken });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Session not found or already logged out" });
        }

        // Must mirror original cookie options or browser won't clear it
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        if (refreshToken) {
            await Session.deleteOne({ refreshToken }).catch(() => { });
        }

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            message: process.env.NODE_ENV === 'production'
                ? "Internal server error"
                : error.message
        });
    }
};

export { register, login, logout, refresh, googleCallback };