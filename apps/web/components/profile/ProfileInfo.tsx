"use client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileInfo() {
    const { user } = useAuthStore();
    if (!user) return null;

    const prefs = user?.learningPreferences;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ── Identity ─────────────────────────── */}
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-lg leading-tight">
                            {user.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {user.email}
                        </p>
                    </div>
                </div>

                {/* ── Account details ───────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            Role
                        </p>
                        <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            Provider
                        </p>
                        <Badge variant="outline">{user.provider}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            Member since
                        </p>
                        <p className="text-sm font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
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

                {/* ── Learning preferences ──────────────── */}
                {prefs && (
                    <>
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-4">
                                Learning Preferences
                            </p>
                            <div className="space-y-4">
                                {/* Goal */}
                                {prefs.goal && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Goal
                                        </p>
                                        <p className="text-sm">{prefs.goal}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Level */}
                                    {prefs.level && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Level
                                            </p>
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {prefs.level}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Daily study time */}
                                    {prefs.dailyStudyTime && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Daily study
                                            </p>
                                            <p className="text-sm font-medium">
                                                {prefs.dailyStudyTime} min / day
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Subjects */}
                                {prefs.subjects?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Topics
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {prefs.subjects.map((s: string) => (
                                                <Badge
                                                    key={s}
                                                    variant="outline"
                                                    className="text-xs font-normal"
                                                >
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* If onboarding not done yet */}
                {!prefs?.goal && (
                    <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                            Learning preferences not set.{" "}
                            <a
                                href="/onboarding"
                                className="underline underline-offset-2 hover:text-foreground transition-colors"
                            >
                                Complete onboarding →
                            </a>
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
