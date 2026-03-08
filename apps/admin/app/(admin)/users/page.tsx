"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { qk } from "@/lib/query-client";
import { StatusBadge } from "@/components/admin/status-badge";
import { toast } from "sonner";
import { Search } from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: qk.users({ search, role, status, page }),
        queryFn: () =>
            adminApi.getUsers({ search, role, status, page, limit: 20 }),
        placeholderData: (prev) => prev, // keeps old data while loading next page
    });

    const ban = useMutation({
        mutationFn: (id: string) => adminApi.banUser(id),
        onSuccess: () => {
            toast.success("User banned");
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });
    const unban = useMutation({
        mutationFn: (id: string) => adminApi.unbanUser(id),
        onSuccess: () => {
            toast.success("User unbanned");
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });
    const del = useMutation({
        mutationFn: (id: string) => adminApi.deleteUser(id),
        onSuccess: () => {
            toast.success("User deleted");
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });

    const users = data?.data?.users ?? [];
    const pg = data?.data?.pagination;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "var(--color-text-3)" }}
                    />
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search name or email…"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-1)",
                    }}
                >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-1)",
                    }}
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Table */}
            <div
                className="rounded-xl overflow-hidden"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr
                            style={{
                                borderBottom: "1px solid var(--color-border)",
                            }}
                        >
                            {[
                                "User",
                                "Role",
                                "Status",
                                "Joined",
                                "Actions",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold"
                                    style={{ color: "var(--color-text-3)" }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-sm"
                                    style={{ color: "var(--color-text-3)" }}
                                >
                                    Loading…
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    style={{
                                        borderBottom:
                                            "1px solid var(--color-border)",
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p
                                                className="font-medium"
                                                style={{
                                                    color: "var(--color-text-1)",
                                                }}
                                            >
                                                {user.name}
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{
                                                    color: "var(--color-text-3)",
                                                }}
                                            >
                                                {user.email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge label={user.role} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge
                                            label={
                                                user.isBanned
                                                    ? "banned"
                                                    : "active"
                                            }
                                        />
                                    </td>
                                    <td
                                        className="px-4 py-3 text-xs font-mono"
                                        style={{ color: "var(--color-text-3)" }}
                                    >
                                        {new Date(
                                            user.createdAt,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/users/${user._id}`}
                                                className="text-xs underline"
                                                style={{
                                                    color: "var(--color-primary)",
                                                }}
                                            >
                                                View
                                            </Link>
                                            {user.isBanned ? (
                                                <button
                                                    onClick={() =>
                                                        unban.mutate(user._id)
                                                    }
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--color-success)",
                                                    }}
                                                >
                                                    Unban
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        ban.mutate(user._id)
                                                    }
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--color-warning)",
                                                    }}
                                                >
                                                    Ban
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm("Delete?"))
                                                        del.mutate(user._id);
                                                }}
                                                className="text-xs"
                                                style={{
                                                    color: "var(--color-danger)",
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pg && (
                <div className="flex justify-between items-center text-sm">
                    <span style={{ color: "var(--color-text-3)" }}>
                        Page {pg.page} of {pg.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={!pg.hasPrev}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
                            style={{
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-2)",
                            }}
                        >
                            ← Prev
                        </button>
                        <button
                            disabled={!pg.hasNext}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
                            style={{
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-2)",
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
