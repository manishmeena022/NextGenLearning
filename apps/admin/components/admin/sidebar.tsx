"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    BarChart3,
    Megaphone,
} from "lucide-react";

const NAV = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Users", icon: Users },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
];

export function Sidebar() {
    const pathname = usePathname();

    const router = useRouter();

    async function handleLogout() {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        router.push("/login");
    }

    return (
        <aside
            className="fixed inset-y-0 left-0 w-56 flex flex-col"
            style={{
                background: "var(--color-surface)",
                borderRight: "1px solid var(--color-border)",
            }}
        >
            {/* Logo */}
            <div
                className="h-14 flex items-center px-5 font-semibold text-sm"
                style={{
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-1)",
                }}
            >
                ⚡ NextGenLearning
            </div>

            {/* Links */}
            <nav className="flex-1 p-3 space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                background: active
                                    ? "rgba(99,102,241,0.15)"
                                    : "transparent",
                                color: active
                                    ? "var(--color-text-1)"
                                    : "var(--color-text-2)",
                            }}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    );
                })}
                <div
                    className="mt-auto pt-4"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                >
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </nav>
        </aside>
    );
}
