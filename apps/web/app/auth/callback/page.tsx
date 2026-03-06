import { Suspense } from "react";
import AuthCallbackInner from "./AuthCallbackInner";

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-muted-foreground">Signing you in...</p>
                </div>
            }
        >
            <AuthCallbackInner />
        </Suspense>
    );
}
