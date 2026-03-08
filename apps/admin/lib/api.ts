const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
    if (typeof document === "undefined") return null; // SSR guard
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="));
    return match ? match.split("=")[1] : null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getToken();

    const res = await fetch(`${BASE}/api${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options?.headers,
        },
        ...options,
    });
    const json = await res.json();
    if (res.status === 401) {
        document.cookie = "accessToken=; path=/; max-age=0";
        window.location.href = "/login";
        throw new Error("Session expired");
    }

    if (!res.ok) throw new Error(json.message ?? "Request failed");

    return json;
}

export const adminApi = {
    // Dashboard
    getDashboardStats: () => request("/admin/stats"),

    // Users
    getUsers: (params = {}) =>
        request(`/admin/users?${new URLSearchParams(params)}`),
    getUserById: (id: string) => request(`/admin/users/${id}`),
    updateUserRole: (id: string, role: string) =>
        request(`/admin/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        }),
    banUser: (id: string) =>
        request(`/admin/users/${id}/ban`, { method: "PATCH" }),
    unbanUser: (id: string) =>
        request(`/admin/users/${id}/unban`, { method: "PATCH" }),
    deleteUser: (id: string) =>
        request(`/admin/users/${id}`, { method: "DELETE" }),

    // Courses
    getCourses: (params = {}) =>
        request(`/admin/courses?${new URLSearchParams(params)}`),
    updateCourseStatus: (
        id: string,
        status: string,
        rejectionReason?: string,
    ) =>
        request(`/admin/courses/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, rejectionReason }),
        }),
    deleteCourse: (id: string) =>
        request(`/admin/courses/${id}`, { method: "DELETE" }),

    // Analytics
    getAnalytics: (period = "30") =>
        request(`/admin/analytics?period=${period}`),

    // Announcements
    sendAnnouncement: (body: object) =>
        request("/admin/announcements", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};
