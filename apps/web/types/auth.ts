export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    provider: "local" | "google";
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface Session {
    _id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    expiresAt: string;
}

export interface AuthResponse {
    accessToken: string;
}
