"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { qk } from "@/lib/query-client";
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type Period = "7" | "30" | "90";

const COLORS = ["#6366F1", "#22D3EE", "#10B981", "#F59E0B"];
const CHART_STYLE = { fontSize: 11, fill: "#64748B" };
const TOOLTIP = {
    background: "#181D2A",
    border: "1px solid #1E2535",
    borderRadius: 8,
    color: "#F1F5F9",
    fontSize: 12,
};

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<Period>("30");

    const { data, isLoading } = useQuery({
        queryKey: qk.analytics(period),
        queryFn: () => adminApi.getAnalytics(period),
    });

    const d = data?.data;

    return (
        <div className="space-y-6">
            {/* Period switcher */}
            <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: "var(--color-text-3)" }}>
                    Showing last {period} days
                </p>
                <div
                    className="flex gap-1 p-1 rounded-lg"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    {(["7", "30", "90"] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                            style={
                                period === p
                                    ? {
                                          background: "var(--color-primary)",
                                          color: "#fff",
                                      }
                                    : { color: "var(--color-text-3)" }
                            }
                        >
                            {p}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Signups vs New Courses */}
            <ChartCard title="Signups vs New Courses" loading={isLoading}>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                        data={mergeByDate(
                            d?.signupsByDay ?? [],
                            d?.coursesByDay ?? [],
                        )}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2535" />
                        <XAxis
                            dataKey="date"
                            tick={CHART_STYLE}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={CHART_STYLE}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip contentStyle={TOOLTIP} />
                        <Line
                            type="monotone"
                            dataKey="signups"
                            stroke="#6366F1"
                            strokeWidth={2}
                            dot={false}
                            name="Signups"
                        />
                        <Line
                            type="monotone"
                            dataKey="courses"
                            stroke="#22D3EE"
                            strokeWidth={2}
                            dot={false}
                            name="New Courses"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Monthly user growth */}
            <ChartCard title="Monthly User Growth" loading={isLoading}>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                        data={d?.userGrowthByMonth ?? []}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="gGrowth"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#22D3EE"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#22D3EE"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2535" />
                        <XAxis
                            dataKey="month"
                            tick={CHART_STYLE}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={CHART_STYLE}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip contentStyle={TOOLTIP} />
                        <Area
                            type="monotone"
                            dataKey="newUsers"
                            stroke="#22D3EE"
                            strokeWidth={2}
                            fill="url(#gGrowth)"
                            dot={false}
                            name="New Users"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Bottom row */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Auth provider breakdown */}
                <ChartCard title="Auth Providers" loading={isLoading}>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={d?.providerBreakdown ?? []}
                                dataKey="count"
                                nameKey="provider"
                                cx="50%"
                                cy="50%"
                                outerRadius={65}
                                innerRadius={35}
                                paddingAngle={4}
                                stroke="none"
                            >
                                {(d?.providerBreakdown ?? []).map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={COLORS[i % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex justify-center gap-4 flex-wrap mt-2">
                        {(d?.providerBreakdown ?? []).map((p, i) => (
                            <div
                                key={p.provider}
                                className="flex items-center gap-1.5 text-xs"
                                style={{ color: "var(--color-text-2)" }}
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        background: COLORS[i % COLORS.length],
                                    }}
                                />
                                {p.provider} ·{" "}
                                <span
                                    className="font-mono font-semibold"
                                    style={{ color: "var(--color-text-1)" }}
                                >
                                    {p.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Top 5 courses */}
                <ChartCard
                    title="Top Courses by Enrollment"
                    loading={isLoading}
                >
                    <div className="space-y-3 mt-1">
                        {(d?.topCourses ?? []).map((course, i) => (
                            <div
                                key={course._id}
                                className="flex items-center gap-3"
                            >
                                <span
                                    className="w-5 text-xs font-mono font-bold shrink-0"
                                    style={{ color: "var(--color-text-3)" }}
                                >
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-xs font-medium truncate"
                                        style={{ color: "var(--color-text-1)" }}
                                    >
                                        {course.title}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: "var(--color-text-3)" }}
                                    >
                                        {course.createdBy?.name}
                                    </p>
                                </div>
                                <span
                                    className="font-mono text-xs font-semibold shrink-0"
                                    style={{ color: "var(--color-text-1)" }}
                                >
                                    {course.enrolledCount}
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

// ── Shared chart wrapper ───────────────────────
function ChartCard({
    title,
    loading,
    children,
}: {
    title: string;
    loading: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-xl p-5"
            style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
            }}
        >
            <p
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--color-text-1)" }}
            >
                {title}
            </p>
            {loading ? (
                <div
                    className="animate-pulse rounded-lg"
                    style={{
                        height: 160,
                        background: "var(--color-surface-2)",
                    }}
                />
            ) : (
                children
            )}
        </div>
    );
}

// ── Merge signups + courses by date ───────────
function mergeByDate(
    signups: { date: string; signups?: number }[],
    courses: { date: string; courses?: number }[],
) {
    const map = new Map<
        string,
        { date: string; signups?: number; courses?: number }
    >();
    signups.forEach((s) =>
        map.set(s.date, { date: s.date, signups: s.signups }),
    );
    courses.forEach((c) =>
        map.set(c.date, {
            ...map.get(c.date),
            date: c.date,
            courses: c.courses,
        }),
    );
    return Array.from(map.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}
