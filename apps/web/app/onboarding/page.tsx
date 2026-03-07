"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { toast } from "sonner";

// Subjects
const SUBJECTS = [
    "Web Development",
    "Mobile Dev",
    "Data Science",
    "Machine Learning",
    "UI / UX Design",
    "DevOps",
    "Cybersecurity",
    "Blockchain",
    "Python",
    "JavaScript",
    "Rust",
    "Go",
    "System Design",
    "Databases",
    "Cloud (AWS)",
    "Open Source",
];

// Level
const LEVELS = [
    { value: "beginner", label: "Beginner", desc: "Just getting started" },
    {
        value: "intermediate",
        label: "Intermediate",
        desc: "Know the basics, want more",
    },
    {
        value: "advanced",
        label: "Advanced",
        desc: "Deep diving & specialising",
    },
];

// Duration
const TIMES = [
    { value: 15, label: "15 min", sub: "Light touch" },
    { value: 30, label: "30 min", sub: "Steady habit" },
    { value: 60, label: "1 hour", sub: "Serious learner" },
    { value: 90, label: "90 min", sub: "Full focus" },
    { value: 120, label: "2 hours", sub: "Deep work" },
];

const STEPS = ["Goal", "Level", "Subjects", "Schedule"];

// ── Step indicator ────────────────────────────────────────
function Steps({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-2 mb-12">
            {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={`flex items-center gap-2 transition-all duration-500 ${i <= current ? "opacity-100" : "opacity-25"}`}
                    >
                        <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all duration-500 ${
                                i < current
                                    ? "border-white bg-white text-black"
                                    : i === current
                                      ? "border-white text-white"
                                      : "border-white/20 text-white/20"
                            }`}
                        >
                            {i < current ? "✓" : i + 1}
                        </div>
                        <span
                            className={`text-xs tracking-wider uppercase hidden sm:block ${i === current ? "text-white" : "text-white/30"}`}
                        >
                            {s}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div
                            className={`w-8 h-px transition-all duration-700 ${i < current ? "bg-white/40" : "bg-white/10"}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Step 0: Goal ──────────────────────────────────────────
function GoalStep({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const suggestions = [
        "Get my first dev job",
        "Build my own SaaS product",
        "Switch careers into tech",
        "Become a better engineer",
        "Learn to build mobile apps",
        "Understand AI & machine learning",
    ];

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="text-2xl font-light mb-1 tracking-tight">
                What's your main goal?
            </h2>
            <p className="text-white/35 text-sm mb-8">
                Be specific — this shapes your entire learning path.
            </p>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. Land a frontend role at a product company within 6 months"
                maxLength={200}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors resize-none mb-4 font-light leading-relaxed"
            />

            <div className="text-[10px] uppercase tracking-widest text-white/20 mb-3">
                Or pick one
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                    <button
                        key={s}
                        onClick={() => onChange(s)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
                            value === s
                                ? "border-white/50 bg-white/10 text-white"
                                : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <div className="text-right text-xs text-white/15 mt-3">
                {value.length}/200
            </div>
        </div>
    );
}

// ── Step 1: Level ─────────────────────────────────────────
function LevelStep({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="text-2xl font-light mb-1 tracking-tight">
                Where are you right now?
            </h2>
            <p className="text-white/35 text-sm mb-8">
                Honest assessment gets better recommendations.
            </p>

            <div className="space-y-3">
                {LEVELS.map(({ value: v, label, desc }) => (
                    <button
                        key={v}
                        onClick={() => onChange(v)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-lg border text-left transition-all duration-200 group ${
                            value === v
                                ? "border-white/40 bg-white/[0.07]"
                                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                        <div>
                            <div
                                className={`text-sm font-medium transition-colors ${value === v ? "text-white" : "text-white/50 group-hover:text-white/70"}`}
                            >
                                {label}
                            </div>
                            <div className="text-xs text-white/25 mt-0.5">
                                {desc}
                            </div>
                        </div>
                        <div
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 shrink-0 ${
                                value === v
                                    ? "border-white bg-white scale-110"
                                    : "border-white/20"
                            }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Step 2: Subjects ──────────────────────────────────────
function SubjectsStep({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const toggle = (s: string) => {
        onChange(
            value.includes(s) ? value.filter((x) => x !== s) : [...value, s],
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="text-2xl font-light mb-1 tracking-tight">
                What do you want to learn?
            </h2>
            <p className="text-white/35 text-sm mb-8">
                Pick up to 5 topics to focus on.
            </p>

            <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => {
                    const selected = value.includes(s);
                    const maxed = value.length >= 5 && !selected;
                    return (
                        <button
                            key={s}
                            onClick={() => !maxed && toggle(s)}
                            disabled={maxed}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all duration-200 ${
                                selected
                                    ? "border-white/40 bg-white/[0.07] text-white"
                                    : maxed
                                      ? "border-white/[0.04] text-white/15 cursor-not-allowed"
                                      : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/60"
                            }`}
                        >
                            <div
                                className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all ${
                                    selected
                                        ? "bg-white border-white"
                                        : "border-white/20"
                                }`}
                            >
                                {selected && (
                                    <span className="text-[8px] text-black font-bold">
                                        ✓
                                    </span>
                                )}
                            </div>
                            {s}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 text-xs text-white/20">
                {value.length === 0 && "Nothing selected yet"}
                {value.length > 0 &&
                    value.length < 5 &&
                    `${value.length} selected — pick up to ${5 - value.length} more`}
                {value.length === 5 && (
                    <span className="text-white/40">5 of 5 selected</span>
                )}
            </div>
        </div>
    );
}

// ── Step 3: Daily time ────────────────────────────────────
function ScheduleStep({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (v: number) => void;
}) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="text-2xl font-light mb-1 tracking-tight">
                How long can you study daily?
            </h2>
            <p className="text-white/35 text-sm mb-8">
                Consistency beats intensity. Pick what you can actually commit
                to.
            </p>

            <div className="space-y-2.5">
                {TIMES.map(({ value: v, label, sub }) => (
                    <button
                        key={v}
                        onClick={() => onChange(v)}
                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-lg border text-left transition-all duration-200 group ${
                            value === v
                                ? "border-white/40 bg-white/[0.07]"
                                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <span
                                className={`text-sm font-medium w-14 transition-colors ${value === v ? "text-white" : "text-white/50"}`}
                            >
                                {label}
                            </span>
                            <span className="text-xs text-white/25">{sub}</span>
                        </div>
                        <div
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 shrink-0 ${
                                value === v
                                    ? "border-white bg-white scale-110"
                                    : "border-white/20"
                            }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Main Onboarding Page ──────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();

    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState("");
    const [level, setLevel] = useState("");
    const [subjects, setSubjects] = useState<string[]>([]);
    const [dailyStudyTime, setDailyStudyTime] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const canNext = [
        goal.trim().length >= 3,
        level !== "",
        subjects.length >= 1,
        dailyStudyTime !== null,
    ];

    const next = () => {
        if (step < STEPS.length - 1) setStep((s) => s + 1);
    };

    const back = () => {
        if (step > 0) setStep((s) => s - 1);
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            const res = await api.put("/auth/onboarding", {
                goal,
                level,
                subjects,
                dailyStudyTime,
            });
            setUser(res.data.data.user);
            toast.success("All set! Your path is ready.");
            router.push("/profile");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const isLast = step === STEPS.length - 1;

    return (
        <div className="min-h-screen bg-[#080808] text-white flex">
            {/* ── Left panel: form ─────────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16 max-w-2xl">
                {/* Wordmark */}
                <div className="mb-16">
                    <span className="text-sm tracking-[0.3em] uppercase text-white/25 font-light">
                        Learn<span className="text-white/60">Flow</span>
                    </span>
                </div>

                <Steps current={step} />

                <div className="min-h-[320px]">
                    {step === 0 && <GoalStep value={goal} onChange={setGoal} />}
                    {step === 1 && (
                        <LevelStep value={level} onChange={setLevel} />
                    )}
                    {step === 2 && (
                        <SubjectsStep value={subjects} onChange={setSubjects} />
                    )}
                    {step === 3 && (
                        <ScheduleStep
                            value={dailyStudyTime}
                            onChange={setDailyStudyTime}
                        />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10">
                    <button
                        onClick={back}
                        className={`text-sm text-white/30 hover:text-white/60 transition-colors ${step === 0 ? "invisible" : ""}`}
                    >
                        ← Back
                    </button>

                    {isLast ? (
                        <button
                            onClick={submit}
                            disabled={!canNext[step] || submitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                "Start learning →"
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={next}
                            disabled={!canNext[step]}
                            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>

            {/* ── Right panel: preview ─────────────────── */}
            <div className="hidden lg:flex w-80 xl:w-96 border-l border-white/[0.05] flex-col justify-center px-10 bg-white/[0.01]">
                <div className="text-[10px] uppercase tracking-widest text-white/20 mb-6">
                    Your profile so far
                </div>

                <div className="space-y-5">
                    {/* Goal */}
                    <div
                        className={`transition-all duration-300 ${goal ? "opacity-100" : "opacity-20"}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">
                            Goal
                        </div>
                        <div className="text-xs text-white/60 leading-relaxed">
                            {goal || "Not set yet"}
                        </div>
                    </div>

                    {/* Level */}
                    <div
                        className={`transition-all duration-300 ${level ? "opacity-100" : "opacity-20"}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">
                            Level
                        </div>
                        <div className="text-xs text-white/60 capitalize">
                            {level || "Not set yet"}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div
                        className={`transition-all duration-300 ${subjects.length ? "opacity-100" : "opacity-20"}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">
                            Topics
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {subjects.length ? (
                                subjects.map((s) => (
                                    <span
                                        key={s}
                                        className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded-full"
                                    >
                                        {s}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-white/30">
                                    Not set yet
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Study time */}
                    <div
                        className={`transition-all duration-300 ${dailyStudyTime ? "opacity-100" : "opacity-20"}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">
                            Daily time
                        </div>
                        <div className="text-xs text-white/60">
                            {dailyStudyTime
                                ? `${dailyStudyTime} min / day`
                                : "Not set yet"}
                        </div>
                    </div>
                </div>

                {/* Completion bar */}
                <div className="mt-10">
                    <div className="flex justify-between text-[10px] text-white/20 mb-2">
                        <span>Profile complete</span>
                        <span>
                            {Math.round(
                                (canNext.filter(Boolean).length / 4) * 100,
                            )}
                            %
                        </span>
                    </div>
                    <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white/30 transition-all duration-500"
                            style={{
                                width: `${(canNext.filter(Boolean).length / 4) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
