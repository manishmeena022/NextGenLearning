"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { qk } from "@/lib/query-client";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Archive,
    Trash2,
    Star,
} from "lucide-react";
import type { CoursesQuery, Course, CourseStatus } from "@/types";

const STATUS_OPTIONS: (CourseStatus | "")[] = [
    "",
    "pending",
    "published",
    "rejected",
    "draft",
    "archived",
];
const LEVEL_OPTIONS = ["", "beginner", "intermediate", "advanced"] as const;

export default function CoursesPage() {
    const qc = useQueryClient();
    const [q, setQ] = useState<CoursesQuery>({
        page: 1,
        limit: 20,
        search: "",
        status: "",
    });
    const [rejectTarget, setRejectTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: qk.courses(q),
        queryFn: () => adminApi.getCourses(q),
        placeholderData: (prev) => prev,
    });

    const updateStatus = useMutation({
        mutationFn: ({
            id,
            status,
            reason,
        }: {
            id: string;
            status: CourseStatus;
            reason?: string;
        }) => adminApi.updateCourseStatus(id, status, reason),
        onSuccess: (_, { status }) => {
            toast.success(`Course ${status}`);
            qc.invalidateQueries({ queryKey: ["courses"] });
            setRejectTarget(null);
            setRejectReason("");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const del = useMutation({
        mutationFn: (id: string) => adminApi.deleteCourse(id),
        onSuccess: () => {
            toast.success("Course deleted");
            qc.invalidateQueries({ queryKey: ["courses"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const courses = data?.data?.courses ?? [];
    const pg = data?.data?.pagination;

    return (
        <div className="space-y-5 animate-in">
            {/* ─── Filters ─── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search
                        className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        style={{ color: "var(--color-text-3)" }}
                    />
                    <input
                        type="text"
                        placeholder="Search title or description…"
                        value={q.search ?? ""}
                        onChange={(e) =>
                            setQ({ ...q, search: e.target.value, page: 1 })
                        }
                        className="w-full rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-1 ring-indigo-500"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>

                <select
                    value={q.status ?? ""}
                    onChange={(e) =>
                        setQ({
                            ...q,
                            status: e.target.value as CourseStatus | "",
                            page: 1,
                        })
                    }
                    className="rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-1)",
                    }}
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s
                                ? s.charAt(0).toUpperCase() + s.slice(1)
                                : "All Statuses"}
                        </option>
                    ))}
                </select>

                <select
                    value={q.level ?? ""}
                    onChange={(e) =>
                        setQ({
                            ...q,
                            level: e.target
                                .value as (typeof LEVEL_OPTIONS)[number],
                            page: 1,
                        })
                    }
                    className="rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-1)",
                    }}
                >
                    {LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                            {l
                                ? l.charAt(0).toUpperCase() + l.slice(1)
                                : "All Levels"}
                        </option>
                    ))}
                </select>

                {pg && (
                    <span
                        className="ml-auto text-xs"
                        style={{ color: "var(--color-text-3)" }}
                    >
                        {formatNumber(pg.total)} courses
                    </span>
                )}
            </div>

            {/* ─── Table ─── */}
            <div
                className="overflow-hidden rounded-xl"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr
                                style={{
                                    borderBottom:
                                        "1px solid var(--color-border)",
                                }}
                            >
                                {[
                                    "Course",
                                    "Instructor",
                                    "Status",
                                    "Level",
                                    "Rating",
                                    "Enrolled",
                                    "Created",
                                    "Actions",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: "var(--color-text-3)" }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                      <tr
                                          key={i}
                                          style={{
                                              borderBottom:
                                                  "1px solid var(--color-border)",
                                          }}
                                      >
                                          {Array.from({ length: 8 }).map(
                                              (_, j) => (
                                                  <td
                                                      key={j}
                                                      className="px-4 py-3"
                                                  >
                                                      <div
                                                          className="h-4 animate-pulse rounded"
                                                          style={{
                                                              background:
                                                                  "var(--color-surface-2)",
                                                              width:
                                                                  j === 0
                                                                      ? "180px"
                                                                      : "70px",
                                                          }}
                                                      />
                                                  </td>
                                              ),
                                          )}
                                      </tr>
                                  ))
                                : courses.map((course) => (
                                      <CourseRow
                                          key={course._id}
                                          course={course}
                                          onPublish={() =>
                                              updateStatus.mutate({
                                                  id: course._id,
                                                  status: "published",
                                              })
                                          }
                                          onArchive={() =>
                                              updateStatus.mutate({
                                                  id: course._id,
                                                  status: "archived",
                                              })
                                          }
                                          onReject={() =>
                                              setRejectTarget({
                                                  id: course._id,
                                                  title: course.title,
                                              })
                                          }
                                          onDelete={() => {
                                              if (
                                                  confirm(
                                                      `Delete "${course.title}"?`,
                                                  )
                                              )
                                                  del.mutate(course._id);
                                          }}
                                      />
                                  ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pg && (
                <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text-3)" }}>
                        Page {pg.page} of {pg.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={!pg.hasPrev}
                            onClick={() =>
                                setQ({ ...q, page: (q.page ?? 1) - 1 })
                            }
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                            style={{
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-2)",
                            }}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <button
                            disabled={!pg.hasNext}
                            onClick={() =>
                                setQ({ ...q, page: (q.page ?? 1) + 1 })
                            }
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                            style={{
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-2)",
                            }}
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Reject modal ─── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                        }}
                    >
                        <h3
                            className="mb-1 text-base font-semibold"
                            style={{ color: "var(--color-text-1)" }}
                        >
                            Reject Course
                        </h3>
                        <p
                            className="mb-4 text-sm"
                            style={{ color: "var(--color-text-3)" }}
                        >
                            "{rejectTarget.title}"
                        </p>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection…"
                            className="w-full resize-none rounded-lg p-3 text-sm outline-none focus:ring-1 ring-red-500"
                            style={{
                                background: "var(--color-surface-2)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-1)",
                            }}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setRejectTarget(null);
                                    setRejectReason("");
                                }}
                                className="rounded-lg px-4 py-2 text-sm"
                                style={{
                                    border: "1px solid var(--color-border)",
                                    color: "var(--color-text-2)",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={
                                    !rejectReason.trim() ||
                                    updateStatus.isPending
                                }
                                onClick={() =>
                                    updateStatus.mutate({
                                        id: rejectTarget.id,
                                        status: "rejected",
                                        reason: rejectReason,
                                    })
                                }
                                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                                style={{
                                    background: "#EF444420",
                                    border: "1px solid #EF444430",
                                    color: "#F87171",
                                }}
                            >
                                {updateStatus.isPending
                                    ? "Rejecting…"
                                    : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CourseRow({
    course,
    onPublish,
    onArchive,
    onReject,
    onDelete,
}: {
    course: Course;
    onPublish: () => void;
    onArchive: () => void;
    onReject: () => void;
    onDelete: () => void;
}) {
    return (
        <tr
            className="transition-colors hover:bg-white/[0.02]"
            style={{ borderBottom: "1px solid var(--color-border)" }}
        >
            <td className="px-4 py-3 max-w-[200px]">
                <div>
                    <p
                        className="truncate font-medium"
                        style={{ color: "var(--color-text-1)" }}
                    >
                        {course.title}
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: "var(--color-text-3)" }}
                    >
                        {course.category}
                    </p>
                </div>
            </td>
            <td
                className="px-4 py-3 text-xs"
                style={{ color: "var(--color-text-2)" }}
            >
                {course.createdBy?.name ?? "—"}
            </td>
            <td className="px-4 py-3">
                <StatusBadge label={course.status} />
            </td>
            <td className="px-4 py-3">
                <StatusBadge label={course.level} />
            </td>
            <td className="px-4 py-3">
                <span
                    className="flex items-center gap-1 text-xs font-mono"
                    style={{ color: "var(--color-text-2)" }}
                >
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    {course.averageRating?.toFixed(1) ?? "—"}
                </span>
            </td>
            <td
                className="px-4 py-3 font-mono text-xs"
                style={{ color: "var(--color-text-2)" }}
            >
                {formatNumber(course.enrolledCount ?? 0)}
            </td>
            <td
                className="px-4 py-3 font-mono text-xs"
                style={{ color: "var(--color-text-3)" }}
            >
                {formatDate(course.createdAt)}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    {course.status === "pending" && (
                        <ActionBtn
                            title="Publish"
                            onClick={onPublish}
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            color="#10B981"
                        />
                    )}
                    {course.status === "pending" && (
                        <ActionBtn
                            title="Reject"
                            onClick={onReject}
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            color="#EF4444"
                        />
                    )}
                    {course.status === "published" && (
                        <ActionBtn
                            title="Archive"
                            onClick={onArchive}
                            icon={<Archive className="h-3.5 w-3.5" />}
                            color="#8B5CF6"
                        />
                    )}
                    <ActionBtn
                        title="Delete"
                        onClick={onDelete}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        color="#EF4444"
                    />
                </div>
            </td>
        </tr>
    );
}

function ActionBtn({
    title,
    onClick,
    icon,
    color,
}: {
    title: string;
    onClick: () => void;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <button
            title={title}
            onClick={onClick}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-all hover:bg-white/10"
            style={{ color }}
        >
            {icon}
        </button>
    );
}
