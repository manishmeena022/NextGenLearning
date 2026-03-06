import { create } from "zustand";
import { User } from "@/types/auth";

interface AuthState {
    accessToken: string | null;
    user: User | null;
    setAccessToken: (token: string) => void;
    setUser: (user: User) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    setAccessToken: (token) => set({ accessToken: token }),
    setUser: (user) => set({ user }),
    clearAuth: () => set({ accessToken: null, user: null }),
}));
