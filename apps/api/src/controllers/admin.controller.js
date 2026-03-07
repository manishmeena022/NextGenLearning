import User from "../models/User.js";
import Course from "../models/Course.js";
import Session from "../models/Session.js";
import mongoose from "mongoose";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersThisMonth,
            newUsersThisWeek,
            bannedUsers,
            totalCourses,
            pendingCourses,
            publishedCourses,
            draftCourses,
            activeSessions,
            signupsByDay,
            usersByRole,
            coursesByCategory,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            User.countDocuments({ isBanned: true }),
            Course.countDocuments(),
            Course.countDocuments({ status: "pending" }),
            Course.countDocuments({ status: "published" }),
            Course.countDocuments({ status: "draft" }),
            Session.countDocuments({ expiresAt: { $gt: now }, isRevoked: false }),

            // Daily signups — last 30 days
            User.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", count: 1, _id: 0 } },
            ]),

            // Users by role
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
                { $project: { role: "$_id", count: 1, _id: 0 } },
            ]),

            // Courses by category
            Course.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
                { $project: { category: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        return res.json({
            success: true,
            data: {
                stats: {
                    users: {
                        total: totalUsers,
                        newThisMonth: newUsersThisMonth,
                        newThisWeek: newUsersThisWeek,
                        banned: bannedUsers,
                    },
                    courses: {
                        total: totalCourses,
                        pending: pendingCourses,
                        published: publishedCourses,
                        draft: draftCourses,
                    },
                    activeSessions,
                },
                charts: { signupsByDay, usersByRole, coursesByCategory },
            },
        });
    } catch (error) {
        console.error("getDashboardStats error:", error);
        res.status(500).json({ success: false, message: "Failed to load dashboard" });
    }
};

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

export const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = "",
            role = "",
            status = "",      // "active" | "banned"
            provider = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (role) query.role = role;
        if (provider) query.provider = provider;
        if (status === "banned") query.isBanned = true;
        if (status === "active") query.isBanned = { $ne: true };

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [users, total] = await Promise.all([
            User.find(query)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .select("-password -passwordResetToken -passwordResetExpiresAt -emailVerificationToken -emailVerificationExpiresAt -__v"),
            User.countDocuments(query),
        ]);

        return res.json({
            success: true,
            data: {
                users,
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
        console.error("getUsers error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

export const getUserById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const [user, sessionCount, courseCount] = await Promise.all([
            User.findById(req.params.id)
                .select("-password -passwordResetToken -passwordResetExpiresAt -emailVerificationToken -emailVerificationExpiresAt -__v"),
            Session.countDocuments({
                userId: req.params.id,
                expiresAt: { $gt: new Date() },
                isRevoked: false,
            }),
            Course.countDocuments({ createdBy: req.params.id }),
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({
            success: true,
            data: { user, sessionCount, courseCount },
        });
    } catch (error) {
        console.error("getUserById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ["user", "teacher", "admin"];

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Role must be one of: ${validRoles.join(", ")}` });
        }

        // Prevent removing the last admin
        if (role !== "admin") {
            const target = await User.findById(req.params.id).select("role");
            if (target?.role === "admin") {
                const adminCount = await User.countDocuments({ role: "admin" });
                if (adminCount <= 1) {
                    return res.status(400).json({ success: false, message: "Cannot demote the last admin" });
                }
            }
        }

        // Prevent self-demotion
        if (req.params.id === req.user.userId && role !== "admin") {
            return res.status(400).json({ success: false, message: "Cannot change your own role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: "-password -__v" }
        );

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.json({
            success: true,
            message: `Role updated to ${role}`,
            data: { user },
        });
    } catch (error) {
        console.error("updateUserRole error:", error);
        res.status(500).json({ success: false, message: "Failed to update role" });
    }
};

export const banUser = async (req, res) => {
    try {
        const { reason = "Violated terms of service" } = req.body;

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Prevent banning yourself
        if (req.params.id === req.user.userId) {
            return res.status(400).json({ success: false, message: "Cannot ban yourself" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot ban an admin" });
        }

        if (user.isBanned) {
            return res.status(400).json({ success: false, message: "User is already banned" });
        }

        user.isBanned = true;
        user.banReason = reason;
        user.bannedAt = new Date();
        user.bannedBy = req.user.userId;
        await user.save();

        // Revoke all active sessions immediately
        await Session.updateMany(
            { userId: user._id },
            { isRevoked: true, revokedAt: new Date() }
        );

        return res.json({
            success: true,
            message: "User banned and all sessions revoked",
        });
    } catch (error) {
        console.error("banUser error:", error);
        res.status(500).json({ success: false, message: "Failed to ban user" });
    }
};

export const unbanUser = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.isBanned) {
            return res.status(400).json({ success: false, message: "User is not banned" });
        }

        user.isBanned = false;
        user.banReason = null;
        user.bannedAt = null;
        user.bannedBy = null;
        await user.save();

        return res.json({
            success: true,
            message: "User unbanned",
            data: { user: user.toSafeObject() },
        });
    } catch (error) {
        console.error("unbanUser error:", error);
        res.status(500).json({ success: false, message: "Failed to unban user" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        if (req.params.id === req.user.userId) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot delete an admin" });
        }

        await Promise.all([
            User.findByIdAndDelete(req.params.id),
            Session.deleteMany({ userId: req.params.id }),
            // Optionally: archive their courses instead of leaving orphaned docs
            Course.updateMany({ createdBy: req.params.id }, { status: "archived" }),
        ]);

        return res.json({ success: true, message: "User deleted and courses archived" });
    } catch (error) {
        console.error("deleteUser error:", error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

// Force-logout a single user — revoke all their sessions
export const revokeUserSessions = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const result = await Session.updateMany(
            { userId: req.params.id, isRevoked: false },
            { isRevoked: true, revokedAt: new Date() }
        );

        return res.json({
            success: true,
            message: `${result.modifiedCount} session(s) revoked`,
        });
    } catch (error) {
        console.error("revokeUserSessions error:", error);
        res.status(500).json({ success: false, message: "Failed to revoke sessions" });
    }
};

// ═══════════════════════════════════════════════════════════
// COURSES
// ═══════════════════════════════════════════════════════════

export const getCourses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = "",
            status = "",
            category = "",
            level = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (status) query.status = status;
        if (category) query.category = { $regex: category, $options: "i" };
        if (level) query.level = level;

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [courses, total] = await Promise.all([
            Course.find(query)
                .populate("createdBy", "name email avatar")
                .populate("reviewedBy", "name")
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .select("-sections -__v"),
            Course.countDocuments(query),
        ]);

        return res.json({
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
        console.error("admin getCourses error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch courses" });
    }
};

export const updateCourseStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const validStatuses = ["pending", "published", "rejected", "archived", "draft"];

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });
        }

        if (status === "rejected" && !rejectionReason) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        course.status = status;
        course.reviewedBy = req.user.userId;
        course.reviewedAt = new Date();

        if (status === "published") {
            course.publishedAt = new Date();
            course.rejectionReason = null;
        }

        if (status === "rejected") {
            course.rejectionReason = rejectionReason;
            course.publishedAt = null;
        }

        await course.save();

        return res.json({
            success: true,
            message: `Course ${status}`,
            data: { course },
        });
    } catch (error) {
        console.error("updateCourseStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to update course status" });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }

        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        return res.json({ success: true, message: "Course deleted" });
    } catch (error) {
        console.error("admin deleteCourse error:", error);
        res.status(500).json({ success: false, message: "Failed to delete course" });
    }
};

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════

export const getAnalytics = async (req, res) => {
    try {
        const { period = "30" } = req.query;
        const daysAgo = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

        const [
            signupsByDay,
            coursesByDay,
            topCourses,
            userGrowthByMonth,
            providerBreakdown,
        ] = await Promise.all([
            User.aggregate([
                { $match: { createdAt: { $gte: daysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", signups: "$count", _id: 0 } },
            ]),

            Course.aggregate([
                { $match: { createdAt: { $gte: daysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", courses: "$count", _id: 0 } },
            ]),

            Course.find({ status: "published" })
                .sort({ enrolledCount: -1 })
                .limit(5)
                .select("title enrolledCount averageRating totalRatings category")
                .populate("createdBy", "name"),

            User.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        newUsers: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { month: "$_id", newUsers: 1, _id: 0 } },
            ]),

            User.aggregate([
                { $group: { _id: "$provider", count: { $sum: 1 } } },
                { $project: { provider: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        return res.json({
            success: true,
            data: {
                signupsByDay,
                coursesByDay,
                topCourses,
                userGrowthByMonth,
                providerBreakdown,
            },
        });
    } catch (error) {
        console.error("getAnalytics error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
};

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════

export const sendAnnouncement = async (req, res) => {
    try {
        const { title, message, targetRole = "all" } = req.body;

        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Title and message are required" });
        }

        const query = targetRole === "all" ? {} : { role: targetRole };
        const recipientCount = await User.countDocuments({ ...query, isActive: true, isBanned: false });

        // In production: push to a BullMQ queue or Notification collection here
        console.log(`📢 Announcement queued → ${recipientCount} users`, { title, targetRole });

        return res.json({
            success: true,
            message: `Announcement queued for ${recipientCount} users`,
            data: { recipientCount },
        });
    } catch (error) {
        console.error("sendAnnouncement error:", error);
        res.status(500).json({ success: false, message: "Failed to send announcement" });
    }
};