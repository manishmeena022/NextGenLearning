"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<Status>("verifying");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token found in the link.");
            return;
        }

        api.get(`/auth/verify-email?token=${token}`)
            .then(() => {
                setStatus("success");
                // Auto-redirect to login after 3 seconds
                setTimeout(() => router.push("/login"), 3000);
            })
            .catch((err) => {
                setStatus("error");
                setMessage(
                    err?.response?.data?.message ??
                        "Verification failed. The link may have expired.",
                );
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
            <div className="w-full max-w-sm text-center">
                {/* Verifying */}
                {status === "verifying" && (
                    <div>
                        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6" />
                        <h1 className="text-lg font-light">
                            Verifying your email...
                        </h1>
                        <p className="text-white/30 text-sm mt-2">
                            This will only take a moment.
                        </p>
                    </div>
                )}

                {/* Success */}
                {status === "success" && (
                    <div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <span className="text-emerald-400 text-xl">✓</span>
                        </div>
                        <h1 className="text-lg font-light">Email verified</h1>
                        <p className="text-white/30 text-sm mt-2">
                            Your account is confirmed. Redirecting to login...
                        </p>
                        <Link
                            href="/login"
                            className="inline-block mt-6 text-xs text-white/40 hover:text-white transition-colors underline underline-offset-2"
                        >
                            Go now →
                        </Link>
                    </div>
                )}

                {/* Error */}
                {status === "error" && (
                    <div>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <span className="text-red-400 text-xl">✕</span>
                        </div>
                        <h1 className="text-lg font-light">
                            Verification failed
                        </h1>
                        <p className="text-white/30 text-sm mt-2">{message}</p>
                        <div className="flex flex-col gap-2 mt-6">
                            <Link
                                href="/profile"
                                className="text-xs text-white/50 hover:text-white transition-colors underline underline-offset-2"
                            >
                                Resend verification email →
                            </Link>
                            <Link
                                href="/login"
                                className="text-xs text-white/30 hover:text-white/50 transition-colors"
                            >
                                Back to login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
