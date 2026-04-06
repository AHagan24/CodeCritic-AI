import { memo } from "react";
import {
  AlertTriangle,
  CheckCheck,
  CircleDot,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReviewResponse } from "@/app/types/review";
import SeverityBadge from "@/components/SeverityBadge";

interface ReviewResultsProps {
  result: ReviewResponse | null;
  loading: boolean;
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return "text-emerald-300";
  }

  if (score >= 80) {
    return "text-sky-300";
  }

  if (score >= 70) {
    return "text-amber-300";
  }

  return "text-rose-300";
}

function ReviewResults({
  result,
  loading,
}: ReviewResultsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6 shadow-[0_14px_44px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            <Sparkles className="size-3.5 text-sky-300" />
            AI Review Results
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
            Structured triage for the latest submission
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Surface the highest-risk findings, understand why they matter, and
            inspect a cleaner implementation before shipping.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Status
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-200">
            <span
              className={`size-2 rounded-full ${
                loading
                  ? "bg-amber-300"
                  : result
                    ? "bg-emerald-300"
                    : "bg-zinc-600"
              }`}
            />
            {loading ? "Analyzing" : result ? "Ready" : "Awaiting review"}
          </div>
        </div>
      </div>

      {!loading && !result ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-black/30 p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300">
            <Sparkles className="size-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">
            No review generated yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
            Run a review to populate summary insights, prioritized issues, and a
            suggested rewrite for the selected snippet.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-[24px] border border-white/6 bg-white/[0.04]" />
            <div className="h-28 rounded-[24px] border border-white/6 bg-white/[0.04]" />
            <div className="h-28 rounded-[24px] border border-white/6 bg-white/[0.04]" />
          </div>
          <div className="h-32 rounded-[24px] border border-white/6 bg-white/[0.04]" />
          <div className="h-44 rounded-[24px] border border-white/6 bg-white/[0.04]" />
          <div className="h-60 rounded-[24px] border border-white/6 bg-white/[0.04]" />
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Review Score
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span
                  className={`text-4xl font-semibold tracking-tight ${getScoreTone(result.score)}`}
                >
                  {result.score}
                </span>
                <span className="pb-1 text-sm text-zinc-500">/100</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Strong baseline with a few targeted improvements recommended
                before merge.
              </p>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Review Context
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-zinc-200">
                  {result.language ?? "Not specified"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-zinc-200">
                  {result.reviewType ?? "Not specified"}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Structured output tuned for fast developer triage.
              </p>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Findings
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                  <AlertTriangle className="size-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {result.issues.length}
                  </p>
                  <p className="text-sm text-zinc-400">prioritized issues</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Highest-impact suggestions ranked by severity.
              </p>
            </article>
          </div>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Executive Summary
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Review synopsis
                </h3>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-200">
                <CheckCheck className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {result.summary}
            </p>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Issue List
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Recommended fixes
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-400">
                <ShieldCheck className="size-3.5 text-sky-300" />
                Sorted by impact
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {result.issues.map((issue, index) => (
                <article
                  key={`${issue.title}-${index}`}
                  className="rounded-[24px] border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {issue.title}
                        </h4>
                        <SeverityBadge severity={issue.severity} />
                        {issue.category ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                            {issue.category}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        {issue.lineReference}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      <CircleDot className="size-3" />
                      Actionable
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-300">
                    {issue.description}
                  </p>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Suggested Fix
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {issue.suggestion}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Improved Code Preview
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Suggested rewrite
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-400">
                Read-only preview
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[#09090c]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {result.language ?? "Not specified"}
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-zinc-200">
                <code>{result.improvedCode}</code>
              </pre>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default memo(ReviewResults);
