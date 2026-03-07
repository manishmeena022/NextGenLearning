export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    provider: string;
    createdAt: string;
    lastLoginAt: string | null;
    isOnboarded: boolean;
    learningPreferences?: {
        goal: string;
        level: "beginner" | "intermediate" | "advanced";
        subjects: string[];
        dailyStudyTime: number;
    };
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
