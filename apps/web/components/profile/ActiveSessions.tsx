"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Session } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ActiveSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const { logout } = useAuth();

    useEffect(() => {
        api.get("/auth/sessions").then((res) => setSessions(res.data));
    }, []);

    const revokeAll = async () => {
        try {
            await api.delete("/auth/sessions");
            await logout();
            toast.success("All sessions revoked");
        } catch {
            toast.error("Failed to revoke sessions");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Sessions</CardTitle>
                <Button variant="destructive" size="sm" onClick={revokeAll}>
                    Logout all devices
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {sessions.map((session) => (
                    <div
                        key={session._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div>
                            <p className="text-sm font-medium truncate max-w-xs">
                                {session.userAgent || "Unknown device"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                IP: {session.ipAddress || "Unknown"} ·{" "}
                                {new Date(
                                    session.createdAt,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No active sessions
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
