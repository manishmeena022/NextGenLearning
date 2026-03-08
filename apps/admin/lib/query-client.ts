import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    },
});

// Query key factory — keeps cache keys consistent
export const qk = {
    dashboard: () => ["dashboard"] as const,
    users: (q?: object) => ["users", q] as const,
    user: (id: string) => ["users", id] as const,
    courses: (q?: object) => ["courses", q] as const,
    analytics: (p: string) => ["analytics", p] as const,
};
