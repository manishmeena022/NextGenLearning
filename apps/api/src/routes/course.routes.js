import express from "express";
import {
    getCourses,
    getCourseBySlug,
    getCategories,
    getMyCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    submitForReview,
    unpublishCourse,
    rateCourse,
} from "../controllers/course.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────
router.get("/", getCourses);
router.get("/categories", getCategories);
router.get("/:slug", getCourseBySlug);

// ── Authenticated ─────────────────────────────────────────
router.post("/:id/rate", authenticate, rateCourse);

// ── Instructor + Admin ────────────────────────────────────
router.get("/my", authenticate, requireRole("teacher", "admin"), getMyCourses);
router.post("/", authenticate, requireRole("teacher", "admin"), createCourse);
router.put("/:id", authenticate, requireRole("teacher", "admin"), updateCourse);
router.delete("/:id", authenticate, requireRole("teacher", "admin"), deleteCourse);
router.patch("/:id/submit", authenticate, requireRole("teacher", "admin"), submitForReview);
router.patch("/:id/unpublish", authenticate, requireRole("teacher", "admin"), unpublishCourse);

export default router;