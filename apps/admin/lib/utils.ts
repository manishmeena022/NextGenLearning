import { formatDistanceToNow, format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ── Tailwind class merger ──────────────────────
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ── Date formatting ────────────────────────────
export function formatDate(date: string | Date, fmt = "MMM d, yyyy") {
    return format(new Date(date), fmt);
}

export function timeAgo(date: string | Date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── Number formatting ──────────────────────────
export function formatNumber(n: number) {
    return new Intl.NumberFormat("en-US").format(n);
}

export function formatCompact(n: number) {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n);
}

// ── String helpers ─────────────────────────────
export function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

// ── Status badge colors ────────────────────────
export const STATUS_COLORS: Record<string, string> = {
    published: "color: #34D399; background: rgba(16,185,129,0.1)",
    pending: "color: #FCD34D; background: rgba(245,158,11,0.1)",
    rejected: "color: #F87171; background: rgba(239,68,68,0.1)",
    draft: "color: #94A3B8; background: rgba(148,163,184,0.1)",
    archived: "color: #C4B5FD; background: rgba(139,92,246,0.1)",
    banned: "color: #F87171; background: rgba(239,68,68,0.1)",
    active: "color: #34D399; background: rgba(16,185,129,0.1)",
    admin: "color: #818CF8; background: rgba(99,102,241,0.1)",
    teacher: "color: #67E8F9; background: rgba(34,211,238,0.1)",
    user: "color: #94A3B8; background: rgba(148,163,184,0.1)",
};
