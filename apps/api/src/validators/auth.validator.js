import { z } from "zod";

// ── Register ──────────────────────────────────────────────
export const registerSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")
        .trim(),
    email: z.string()
        .email("Invalid email address")
        .toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
});

// ── Login ─────────────────────────────────────────────────
// Only checks presence — never validate format on login
// (users created before stricter rules would be locked out)
export const loginSchema = z.object({
    email: z.string()
        .email("Invalid email address")
        .toLowerCase(),
    password: z.string()
        .min(1, "Password is required"),
});

// ── Onboarding ────────────────────────────────────────────
export const onboardingSchema = z.object({
    goal: z.string()
        .min(3, "Goal must be at least 3 characters")
        .max(200, "Goal must be less than 200 characters")
        .trim(),
    level: z.enum(["beginner", "intermediate", "advanced"], {
        errorMap: () => ({ message: "Level must be beginner, intermediate, or advanced" }),
    }),
    subjects: z.array(z.string().min(1).max(50).trim())
        .min(1, "Select at least one subject")
        .max(10, "You can select at most 10 subjects"),
    dailyStudyTime: z.coerce.number()
        .refine(val => [15, 30, 60, 90, 120].includes(val), {
            message: "Daily study time must be 15, 30, 60, 90 or 120 minutes",
        }),
});

// ── Forgot password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z.string()
        .email("Invalid email address")
        .toLowerCase(),
});

// ── Reset password ────────────────────────────────────────
export const resetPasswordSchema = z.object({
    token: z.string()
        .min(1, "Reset token is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    confirmPassword: z.string()
        .min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// ── Change password ───────────────────────────────────────
export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    confirmPassword: z.string()
        .min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});