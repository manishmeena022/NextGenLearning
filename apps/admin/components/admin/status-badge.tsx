const COLORS: Record<string, string> = {
    published: "color: #34D399; background: rgba(16,185,129,0.1)",
    pending: "color: #FCD34D; background: rgba(245,158,11,0.1)",
    rejected: "color: #F87171; background: rgba(239,68,68,0.1)",
    draft: "color: #94A3B8; background: rgba(148,163,184,0.1)",
    archived: "color: #C4B5FD; background: rgba(139,92,246,0.1)",
    banned: "color: #F87171; background: rgba(239,68,68,0.1)",
    active: "color: #34D399; background: rgba(16,185,129,0.1)",
    admin: "color: #818CF8; background: rgba(99,102,241,0.1)",
    teacher: "color: #67E8F9; background: rgba(34,211,238,0.1)",
    user: "color: #94A3B8; background: rgba(148,163,184,0.1)",
};

export function StatusBadge({ label }: { label: string }) {
    const style =
        COLORS[label.toLowerCase()] ??
        "color: #94A3B8; background: rgba(148,163,184,0.1)";
    return (
        <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
            style={
                Object.fromEntries(
                    style.split(";").map((s) => s.trim().split(": ")),
                ) as React.CSSProperties
            }
        >
            {label}
        </span>
    );
}
