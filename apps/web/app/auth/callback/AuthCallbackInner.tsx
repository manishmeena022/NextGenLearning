// app/auth/callback/AuthCallbackInner.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function AuthCallbackInner() {
    const router = useRouter();
    const params = useSearchParams();
    const { setAccessToken } = useAuthStore();

    useEffect(() => {
        const token = params.get("token");
        const error = params.get("error");

        if (error) {
            toast.error("Google sign-in failed. Please try again.");
            router.replace("/login");
            return;
        }

        if (token) {
            setAccessToken(token);
            window.history.replaceState({}, "", "/auth/callback");
            toast.success("Signed in with Google!");
            router.replace("/profile");
            return;
        }

        router.replace("/login");
    }, [params, router, setAccessToken]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Signing you in...</p>
        </div>
    );
}
