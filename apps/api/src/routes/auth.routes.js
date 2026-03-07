import express from "express";
import passport from "passport";
import {
    register,
    login,
    googleCallback,
    refresh,
    logout,
    logoutAll,
    getCurrentUser,
    updateProfile,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    getSessions,
    revokeSession,
    deleteAccount,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

import {
    registerSchema,
    loginSchema,
    onboardingSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "../validators/auth.validator.js"
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/verify-email", verifyEmail);

// ── Google OAuth ──────────────────────────────────────────
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }),
    googleCallback
);

// ── Authenticated ─────────────────────────────────────────
router.use(authenticate); // everything below requires a valid token

router.post("/logout", logout);
router.post("/logout-all", logoutAll);
router.get("/me", getCurrentUser);
router.put("/onboarding", validate(onboardingSchema), updateProfile);
router.post("/resend-verification", resendVerificationEmail);
router.post("/change-password", validate(changePasswordSchema), changePassword);
router.delete("/account", deleteAccount);

// Sessions
router.get("/sessions", getSessions);
router.delete("/sessions/:sessionId", revokeSession);

export default router;