"use client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default function Navbar() {
    const { logout } = useAuth();
    const { user } = useAuthStore();

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-lg">
                    NextGenLearning
                </Link>
                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            {/* <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar> */}
                            <span className="text-sm text-muted-foreground">
                                {user?.name}
                            </span>
                        </>
                    )}
                    <Button variant="outline" size="sm" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>
        </nav>
    );
}
