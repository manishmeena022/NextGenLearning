"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function ChangePasswordForm() {
    const { user } = useAuthStore();

    const form = useForm<ChangePasswordInput>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Google users can't change password
    if (user?.provider === "google") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Your account uses Google sign-in. Password change is not
                        available.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const onSubmit = async (data: ChangePasswordInput) => {
        try {
            await api.put("/users/change-password", data);
            form.reset();
            toast.success("Password changed successfully");
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || "Password change failed",
            );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {(
                            [
                                "currentPassword",
                                "newPassword",
                                "confirmPassword",
                            ] as const
                        ).map((name) => (
                            <FormField
                                key={name}
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {name === "currentPassword"
                                                ? "Current Password"
                                                : name === "newPassword"
                                                  ? "New Password"
                                                  : "Confirm New Password"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting
                                ? "Changing..."
                                : "Change password"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
