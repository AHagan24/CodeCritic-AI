"use client";

import type { FormEvent } from "react";
import {
  ChevronDown,
  Code2,
  LockKeyhole,
  ScanSearch,
  Sparkles,
} from "lucide-react";

interface ReviewFormProps {
  code: string;
  language: string;
  reviewType: string;
  loading: boolean;
  error: string;
  onCodeChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onReviewTypeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const languages = ["TypeScript", "JavaScript", "Python", "Go", "Rust"];
const reviewTypes = [
  "Full Review",
  "Security Audit",
  "Performance Pass",
  "Readability Check",
  "Bug Risk Scan",
];

const featureCards = [
  {
    icon: ScanSearch,
    label: "Coverage",
    value: "Bugs, security, readability, performance",
  },
  {
    icon: LockKeyhole,
    label: "Signal",
    value: "Ranked issues with severity-based recommendations",
  },
  {
    icon: Sparkles,
    label: "Workflow",
    value: "Mocked client review flow with production-style UX",
  },
];

function fieldClassName() {
  return "w-full appearance-none rounded-2xl border border-white/10 bg-[#0d0d10] px-4 py-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-white/20 focus:bg-[#0b0b0e] focus:ring-4 focus:ring-white/5";
}

export default function ReviewForm({
  code,
  language,
  reviewType,
  loading,
  error,
  onCodeChange,
  onLanguageChange,
  onReviewTypeChange,
  onSubmit,
}: ReviewFormProps) {
  return (
    <section
      id="workspace-form"
      className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            <Code2 className="size-3.5 text-sky-300" />
            Submit Code
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
            Review a snippet before it ships
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose a language, pick the kind of review you want, and generate a
            polished AI assessment with realistic startup-product presentation.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100/80">
            Session
          </p>
          <p className="mt-2 text-sm font-medium text-sky-50">Demo workspace</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {featureCards.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-zinc-200">
              <item.icon className="size-4" />
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{item.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium text-zinc-300">
              Language
            </span>
            <div className="relative">
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value)}
                className={fieldClassName()}
              >
                {languages.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-sm font-medium text-zinc-300">
              Review Type
            </span>
            <div className="relative">
              <select
                value={reviewType}
                onChange={(event) => onReviewTypeChange(event.target.value)}
                className={fieldClassName()}
              >
                {reviewTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </label>
        </div>

        <label className="block">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-zinc-300">Code Input</span>
            <span className="text-xs text-zinc-500">
              Best with hooks, services, utilities, or API handlers
            </span>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09090c] shadow-inner shadow-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-400" />
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                editor.tsx
              </span>
            </div>

            <textarea
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder="Paste a code snippet to generate a realistic AI review with summary, severity-ranked findings, and an improved implementation preview."
              spellCheck={false}
              className="min-h-[360px] w-full resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </div>
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.045] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Reviews are simulated on the client
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                The UI is production-style today and ready for backend wiring later.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-300" />
              Ready to analyze
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Running Review..." : "Run AI Review"}
          </button>

          <p className="text-sm text-zinc-500">
            Output includes a score, issue list, and rewritten code preview.
          </p>
        </div>
      </form>
    </section>
  );
}
