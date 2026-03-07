import Course from "../models/Course.js";
import mongoose from "mongoose";

// ── Helpers ───────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ═══════════════════════════════════════════════════════════
// PUBLIC
// ═══════════════════════════════════════════════════════════

// GET /api/courses
export const getCourses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = "",
            category = "",
            level = "",
            isFree,
            sortBy = "createdAt",   // createdAt | averageRating | enrolledCount | price
            sortOrder = "desc",
        } = req.query;

        const query = { status: "published" };

        // Full-text search (uses text index on title + description + tags)
        if (search) {
            query.$text = { $search: search };
        }

        if (category) query.category = { $regex: category, $options: "i" };
        if (level) query.level = level;
        if (isFree !== undefined) query.isFree = isFree === "true";

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        // If text search, also sort by text score
        const projection = search ? { score: { $meta: "textScore" } } : {};

        const [courses, total] = await Promise.all([
            Course.find(query, projection)
                .populate("createdBy", "name avatar")
                .sort(search ? { score: { $meta: "textScore" } } : sort)
                .skip(skip)
                .limit(Number(limit))
                .select("-sections -requirements -outcomes -targetAudience"), // lean list view
            Course.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: {
                courses,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                    hasNext: Number(page) < Math.ceil(total / Number(limit)),
                    hasPrev: Number(page) > 1,
                },
            },
        });
    } catch (error) {
        console.error("getCourses error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch courses" });
    }
};

// GET /api/courses/:slug
export const getCourseBySlug = async (req, res) => {
    try {
        const course = await Course.findOne({
            slug: req.params.slug,
            status: "published",
        }).populate("createdBy", "name avatar bio");

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        res.json({ success: true, data: { course } });
    } catch (error) {
        console.error("getCourseBySlug error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch course" });
    }
};

// GET /api/courses/categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Course.aggregate([
            { $match: { status: "published" } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { category: "$_id", count: 1, _id: 0 } },
        ]);

        res.json({ success: true, data: { categories } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
};

// ═══════════════════════════════════════════════════════════
// INSTRUCTOR — own courses
// ═══════════════════════════════════════════════════════════

// GET /api/courses/my
export const getMyCourses = async (req, res) => {
    try {
        const courses = await Course.find({ createdBy: req.user.userId })
            .sort({ createdAt: -1 })
            .select("-sections");

        res.json({ success: true, data: { courses } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch your courses" });
    }
};

// POST /api/courses
export const createCourse = async (req, res) => {
    try {
        const {
            title, description, shortDescription,
            category, subcategory, tags,
            level, language,
            price, currency,
            requirements, outcomes, targetAudience,
            thumbnail, previewVideoUrl,
        } = req.body;

        const course = await Course.create({
            title, description, shortDescription,
            category, subcategory,
            tags: tags ?? [],
            level, language: language ?? "English",
            price: price ?? 0,
            currency: currency ?? "USD",
            requirements: requirements ?? [],
            outcomes: outcomes ?? [],
            targetAudience: targetAudience ?? [],
            thumbnail: thumbnail ?? null,
            previewVideoUrl: previewVideoUrl ?? null,
            createdBy: req.user.userId,
            status: "draft",
        });

        res.status(201).json({
            success: true,
            message: "Course created as draft",
            data: { course },
        });
    } catch (error) {
        console.error("createCourse error:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(e => ({
                field: e.path,
                message: e.message,
            }));
            return res.status(400).json({ success: false, errors });
        }
        res.status(500).json({ success: false, message: "Failed to create course" });
    }
};

// PUT /api/courses/:id
export const updateCourse = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // Only the owner can edit (admins handled separately)
        if (course.createdBy.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "Not your course" });
        }

        // Can't edit a published course directly — must go back to draft
        if (course.status === "published") {
            return res.status(400).json({
                success: false,
                message: "Unpublish the course before editing. Set status to draft first.",
            });
        }

        const EDITABLE = [
            "title", "description", "shortDescription",
            "category", "subcategory", "tags",
            "level", "language",
            "price", "currency",
            "requirements", "outcomes", "targetAudience",
            "thumbnail", "previewVideoUrl", "sections",
        ];

        EDITABLE.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save(); // triggers slug + isFree middleware

        res.json({ success: true, message: "Course updated", data: { course } });
    } catch (error) {
        console.error("updateCourse error:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(e => ({
                field: e.path, message: e.message,
            }));
            return res.status(400).json({ success: false, errors });
        }
        res.status(500).json({ success: false, message: "Failed to update course" });
    }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const isOwner = course.createdBy.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }

        // Prevent deleting a live course with enrollments
        if (course.status === "published" && course.enrolledCount > 0 && !isAdmin) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete a course with ${course.enrolledCount} enrolled students. Archive it instead.`,
            });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "Course deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete course" });
    }
};

// PATCH /api/courses/:id/submit
// Instructor submits draft for admin review
export const submitForReview = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        if (course.createdBy.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "Not your course" });
        }

        if (course.status !== "draft" && course.status !== "rejected") {
            return res.status(400).json({
                success: false,
                message: `Can only submit a draft or rejected course. Current status: ${course.status}`,
            });
        }

        // Basic completeness check before submitting
        const missing = [];
        if (!course.thumbnail) missing.push("thumbnail");
        if (!course.outcomes?.length) missing.push("outcomes");
        if (course.totalLessons === 0) missing.push("at least one lesson");

        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: `Complete these before submitting: ${missing.join(", ")}`,
            });
        }

        course.status = "pending";
        course.rejectionReason = null;
        await course.save();

        res.json({ success: true, message: "Course submitted for review", data: { course } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit course" });
    }
};

// PATCH /api/courses/:id/unpublish
export const unpublishCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const isOwner = course.createdBy.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }

        course.status = "draft";
        await course.save();

        res.json({ success: true, message: "Course unpublished", data: { course } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to unpublish course" });
    }
};

// ═══════════════════════════════════════════════════════════
// RATINGS
// ═══════════════════════════════════════════════════════════

// POST /api/courses/:id/rate
export const rateCourse = async (req, res) => {
    try {
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }

        const course = await Course.findById(req.params.id);
        if (!course || course.status !== "published") {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // In production you'd have a separate Rating model.
        // Here we update the denormalised stats directly.
        // A real implementation would check the user hasn't already rated.
        const prevTotal = course.averageRating * course.totalRatings;
        course.totalRatings += 1;
        course.averageRating = (prevTotal + rating) / course.totalRatings;
        course.averageRating = Math.round(course.averageRating * 10) / 10; // 1 decimal

        await course.save();

        res.json({
            success: true,
            message: "Rating submitted",
            data: {
                averageRating: course.averageRating,
                totalRatings: course.totalRatings,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit rating" });
    }
};

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════

// PATCH /api/admin/courses/:id/status  (handled in admin controller)
// Kept here for reference — see admin.controller.js