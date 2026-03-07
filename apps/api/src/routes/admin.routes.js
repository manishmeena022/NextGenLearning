import express from "express";
import {
    getDashboardStats,
    getUsers,
    getUserById,
    updateUserRole,
    banUser,
    unbanUser,
    deleteUser,
    revokeUserSessions,
    getCourses,
    updateCourseStatus,
    deleteCourse,
    getAnalytics,
    sendAnnouncement,
} from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticate);
router.use(requireRole("admin"));

// ── Dashboard ─────────────────────────────────────────────
router.get("/stats", getDashboardStats);

// ── Users ─────────────────────────────────────────────────
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.patch("/users/:id/revoke", revokeUserSessions);
router.delete("/users/:id", deleteUser);

// ── Courses ───────────────────────────────────────────────
router.get("/courses", getCourses);
router.patch("/courses/:id/status", updateCourseStatus);
router.delete("/courses/:id", deleteCourse);

// ── Analytics ─────────────────────────────────────────────
router.get("/analytics", getAnalytics);

// ── Announcements ─────────────────────────────────────────
router.post("/announce", sendAnnouncement);

export default router;