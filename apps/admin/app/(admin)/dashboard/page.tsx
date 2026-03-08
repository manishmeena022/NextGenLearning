"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { qk } from "@/lib/query-client";
import { StatCard } from "@/components/admin/stat-card";
import { Users, BookOpen, Clock, Shield } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: qk.dashboard(),
        queryFn: adminApi.getDashboardStats,
    });

    if (isLoading)
        return <p style={{ color: "var(--color-text-3)" }}>Loading…</p>;

    console.log("DaTA", data);
    const { stats, charts } = data?.data;

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.users.total}
                    icon={Users}
                    sub={`+${stats.users.newThisWeek} this week`}
                />
                <StatCard
                    title="Total Courses"
                    value={stats.courses.total}
                    icon={BookOpen}
                    sub={`${stats.courses.pending} pending`}
                />
                <StatCard
                    title="Active Sessions"
                    value={stats.activeSessions}
                    icon={Clock}
                />
                <StatCard
                    title="Banned Users"
                    value={stats.users.banned}
                    icon={Shield}
                />
            </div>

            {/* Signups chart */}
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
                    New Signups — Last 30 Days
                </p>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={charts.signupsByDay}>
                        <defs>
                            <linearGradient
                                id="grad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#6366F1"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#6366F1"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2535" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "#64748B" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#64748B" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#181D2A",
                                border: "1px solid #1E2535",
                                borderRadius: 8,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#6366F1"
                            strokeWidth={2}
                            fill="url(#grad)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
