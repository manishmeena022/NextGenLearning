import express from "express";
import { googleCallback, login, refresh, register, logout } from "../controllers/auth.controller.js";
import passport from "passport";
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", authMiddleware, logout);

router.post("/refresh", refresh)

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }), googleCallback);

export default router