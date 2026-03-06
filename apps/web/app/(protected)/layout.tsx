"use client";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/shared/Navbar";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { fetchUser } = useAuth();

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
