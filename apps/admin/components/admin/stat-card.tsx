import type { LucideIcon } from "lucide-react";

interface Props {
    title: string;
    value: number | string;
    icon: LucideIcon;
    sub?: string;
}

export function StatCard({ title, value, icon: Icon, sub }: Props) {
    return (
        <div
            className="rounded-xl p-5"
            style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--color-text-3)" }}
                >
                    {title}
                </p>
                <Icon
                    className="h-4 w-4"
                    style={{ color: "var(--color-text-3)" }}
                />
            </div>
            <p
                className="text-2xl font-bold font-mono"
                style={{ color: "var(--color-text-1)" }}
            >
                {value}
            </p>
            {sub && (
                <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-text-3)" }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}
