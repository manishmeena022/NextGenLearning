export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div
                className="
                w-full 
                max-w-md 
                p-8 
                rounded-xl 
                border
                bg-[var(--color-surface)]
                border-[var(--color-border)]
                shadow-xl
            "
            >
                {children}
            </div>
        </div>
    );
}
