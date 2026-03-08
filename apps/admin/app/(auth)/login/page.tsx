"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!email || !password) return;
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include", // ← sends & receives the httpOnly cookie
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                },
            );

            const json = await res.json();

            console.log("JSON :", json);

            if (!res.ok) {
                toast.error(json.message ?? "Login failed");
                return;
            }

            if (json.data?.user?.role !== "admin") {
                toast.error("Access denied — admin accounts only");
                return;
            }

            const token = json.data.accessToken;
            document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Strict`;

            router.push("/dashboard");
        } catch {
            toast.error("Could not reach the server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2.5 mb-8">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                        background: "linear-gradient(135deg, #6366F1, #22D3EE)",
                    }}
                >
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-text-1)" }}
                >
                    NEXT GEN LEARNING
                </span>
            </div>

            {/* Card */}
            <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div>
                    <h1
                        className="text-base font-semibold"
                        style={{ color: "var(--color-text-1)" }}
                    >
                        Sign in
                    </h1>
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: "var(--color-text-3)" }}
                    >
                        Admin access only
                    </p>
                </div>

                {/* Email */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="admin@example.com"
                        className="w-full px-4 py-2.5 text-sm rounded-lg outline-none focus:ring-1 ring-indigo-500"
                        style={{
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>

                {/* Password */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--color-text-2)" }}
                    >
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 text-sm rounded-lg outline-none focus:ring-1 ring-indigo-500"
                        style={{
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-1)",
                        }}
                    />
                </div>

                <button
                    disabled={!email || !password || loading}
                    onClick={handleSubmit}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50 hover:opacity-90"
                    style={{
                        background: "linear-gradient(135deg, #6366F1, #22D3EE)",
                        color: "#fff",
                    }}
                >
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </div>
        </div>
    );
}
