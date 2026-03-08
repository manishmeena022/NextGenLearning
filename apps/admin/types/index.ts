export type UserRole = "user" | "teacher" | "admin";
export type CourseStatus =
    | "pending"
    | "published"
    | "rejected"
    | "archived"
    | "draft";

export interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
    provider: string;
    isBanned: boolean;
    isEmailVerified: boolean;
    createdAt: string;
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    status: CourseStatus;
    level: string;
    category: string;
    enrolledCount: number;
    averageRating: number;
    price: number;
    createdBy: Pick<User, "_id" | "name" | "email">;
    rejectionReason?: string;
    createdAt: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ── Query param shapes ─────────────────────────
export interface UsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole | "";
    status?: "active" | "banned" | "";
    provider?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface CoursesQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: CourseStatus | "";
    category?: string;
    level?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
