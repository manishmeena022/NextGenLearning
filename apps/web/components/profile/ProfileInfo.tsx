"use client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileInfo() {
    const { user } = useAuthStore();
    if (!user) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{user.name}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant="secondary" className="mt-1">
                            {user.role}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Provider
                        </p>
                        <Badge variant="outline" className="mt-1">
                            {user.provider}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Member since
                        </p>
                        <p className="text-sm font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Last login
                        </p>
                        <p className="text-sm font-medium">
                            {user.lastLoginAt
                                ? new Date(
                                      user.lastLoginAt,
                                  ).toLocaleDateString()
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
