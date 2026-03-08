"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const data = [
    { month: "Jan", users: 200 },
    { month: "Feb", users: 350 },
    { month: "Mar", users: 500 },
];

export default function UserGrowthChart() {
    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">User Growth</h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
