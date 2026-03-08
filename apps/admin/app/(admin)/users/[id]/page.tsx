"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { qk } from "@/lib/query-client";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatDate, timeAgo, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
    ArrowLeft,
    BookOpen,
    Clock,
    Shield,
    ShieldOff,
    Trash2,
    LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: qk.user(id),
        queryFn: () => adminApi.getUserById(id),
    });

    const ban = useMutation({
        mutationFn: () => adminApi.banUser(id),
        onSuccess: () => {
            toast.success("User banned");
            qc.invalidateQueries({ queryKey: qk.user(id) });
        },
    });
    const unban = useMutation({
        mutationFn: () => adminApi.unbanUser(id),
        onSuccess: () => {
            toast.success("User unbanned");
            qc.invalidateQueries({ queryKey: qk.user(id) });
        },
    });
    // const revoke = useMutation({
    //     mutationFn: () => adminApi.revokeUserSessions(id),
    //     onSuccess: () => toast.success("All sessions revoked"),
    // });
    const del = useMutation({
        mutationFn: () => adminApi.deleteUser(id),
        onSuccess: () => {
            toast.success("User deleted");
            router.push("/users");
        },
    });

    if (isLoading) return <UserDetailSkeleton />;
    if (!data?.success)
        return <p style={{ color: "var(--color-text-3)" }}>User not found.</p>;

    const { user, sessionCount, courseCount } = data.data;

    return (
        <div className="mx-auto max-w-3xl space-y-6 animate-in">
            {/* Back */}
            <Link
                href="/users"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--color-text-3)" }}
            >
                <ArrowLeft className="h-4 w-4" /> Back to users
            </Link>

            {/* Profile card */}
            <div
                className="rounded-xl p-6"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div className="flex items-start gap-5">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/30"
                        />
                    ) : (
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                            style={{
                                background:
                                    "linear-gradient(135deg, #6366F1, #22D3EE)",
                                color: "white",
                            }}
                        >
                            {getInitials(user.name)}
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2
                                className="text-xl font-bold"
                                style={{ color: "var(--color-text-1)" }}
                            >
                                {user.name}
                            </h2>
                            <StatusBadge
                                label={user.isBanned ? "banned" : "active"}
                            />
                            <StatusBadge label={user.role} />
                        </div>
                        <p
                            className="mt-1 text-sm"
                            style={{ color: "var(--color-text-2)" }}
                        >
                            {user.email}
                        </p>
                        <p
                            className="mt-0.5 text-xs"
                            style={{ color: "var(--color-text-3)" }}
                        >
                            Joined {formatDate(user.createdAt)} ·{" "}
                            {timeAgo(user.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Meta grid */}
                <div
                    className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3"
                    style={{ borderColor: "var(--color-border)" }}
                >
                    {[
                        { label: "Provider", value: user.provider },
                        {
                            label: "Email verified",
                            value: user.isEmailVerified ? "Yes" : "No",
                        },
                        {
                            label: "Account active",
                            value: user.isActive ? "Yes" : "No",
                        },
                        {
                            label: "Last updated",
                            value: formatDate(user.updatedAt),
                        },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p
                                className="text-xs uppercase tracking-wider"
                                style={{ color: "var(--color-text-3)" }}
                            >
                                {label}
                            </p>
                            <p
                                className="mt-0.5 text-sm font-medium"
                                style={{ color: "var(--color-text-1)" }}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    title="Active Sessions"
                    value={sessionCount}
                    icon={Clock}
                    accent="cyan"
                />
                <StatCard
                    title="Courses Created"
                    value={courseCount}
                    icon={BookOpen}
                    accent="indigo"
                />
            </div>

            {/* Actions */}
            <div
                className="rounded-xl p-5"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <p
                    className="mb-4 text-sm font-semibold"
                    style={{ color: "var(--color-text-1)" }}
                >
                    Actions
                </p>
                <div className="flex flex-wrap gap-3">
                    {user.isBanned ? (
                        <Btn
                            label="Unban User"
                            icon={<ShieldOff className="h-4 w-4" />}
                            color="#10B981"
                            onClick={() => unban.mutate()}
                            loading={unban.isPending}
                        />
                    ) : (
                        <Btn
                            label="Ban User"
                            icon={<Shield className="h-4 w-4" />}
                            color="#F59E0B"
                            onClick={() => ban.mutate()}
                            loading={ban.isPending}
                        />
                    )}
                    {/* <Btn
                        label="Revoke Sessions"
                        icon={<LogOut className="h-4 w-4" />}
                        color="#6366F1"
                        onClick={() => revoke.mutate()}
                        loading={revoke.isPending}
                    /> */}
                    <Btn
                        label="Delete User"
                        icon={<Trash2 className="h-4 w-4" />}
                        color="#EF4444"
                        onClick={() => {
                            if (confirm("Permanently delete this user?"))
                                del.mutate();
                        }}
                        loading={del.isPending}
                    />
                </div>
            </div>
        </div>
    );
}

function Btn({
    label,
    icon,
    color,
    onClick,
    loading,
}: {
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    loading?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{
                border: `1px solid ${color}30`,
                background: `${color}15`,
                color,
            }}
        >
            {icon}
            {loading ? "Loading…" : label}
        </button>
    );
}

function UserDetailSkeleton() {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div
                className="h-56 animate-pulse rounded-xl"
                style={{ background: "var(--color-surface)" }}
            />
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="h-24 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                />
                <div
                    className="h-24 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                />
            </div>
        </div>
    );
}
