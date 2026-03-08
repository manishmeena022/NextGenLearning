"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type TargetRole = "all" | "user" | "teacher" | "admin";

export default function AnnouncementsPage() {
    const [form, setForm] = useState({
        title: "",
        message: "",
        targetRole: "all" as TargetRole,
    });

    const send = useMutation({
        mutationFn: () => adminApi.sendAnnouncement(form),
        onSuccess: (res: any) =>
            toast.success(`Queued for ${res.data.recipientCount} users`),
        onError: (e: Error) => toast.error(e.message),
    });

    const isValid =
        form.title.trim().length > 0 && form.message.trim().length > 0;

    return (
        <div className="max-w-xl space-y-6">
            {/* Title */}
            <div>
                <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--color-text-1)" }}
                >
                    Send Announcement
                </h2>
                <p
                    className="text-sm mt-1"
                    style={{ color: "var(--color-text-3)" }}
                >
                    Broadcast a message to a group of users
                </p>
            </div>

            {/* Form card */}
            <div
                className="rounded-xl p-5 space-y-4"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                {/* Target audience */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        Target Audience
                    </label>
                    <select
                        value={form.targetRole}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                targetRole: e.target.value as TargetRole,
                            })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    >
                        <option value="all">All Users</option>
                        <option value="user">Students only</option>
                        <option value="teacher">Teachers only</option>
                        <option value="admin">Admins only</option>
                    </select>
                </div>

                {/* Title field */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        Title{" "}
                        <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                        }
                        placeholder="Announcement title…"
                        className="w-full px-4 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>

                {/* Message field */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        Message{" "}
                        <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <textarea
                        rows={4}
                        value={form.message}
                        onChange={(e) =>
                            setForm({ ...form, message: e.target.value })
                        }
                        placeholder="Write your message here…"
                        className="w-full resize-none px-4 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>

                {/* Submit */}
                <button
                    disabled={!isValid || send.isPending}
                    onClick={() => send.mutate()}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50 hover:opacity-90"
                    style={{
                        background: "linear-gradient(135deg, #6366F1, #22D3EE)",
                        color: "#fff",
                    }}
                >
                    {send.isPending ? "Sending…" : "Send Announcement"}
                </button>
            </div>
        </div>
    );
}
