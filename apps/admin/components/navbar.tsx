"use client";

import { useAuthStore } from "@/store/auth.store";

export default function Navbar() {
    const user = useAuthStore((s) => s.user);

    return (
        <div className="flex justify-between items-center bg-white border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>

            <div className="flex items-center gap-4">
                <span className="text-sm">{user?.name}</span>

                <img src="/avatar.png" className="w-8 h-8 rounded-full" />
            </div>
        </div>
    );
}
