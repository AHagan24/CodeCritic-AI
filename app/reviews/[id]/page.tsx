import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileCode2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";
import Review from "@/app/models/Review";
import CopyCodeButton from "@/components/CopyCodeButton";
import SeverityBadge from "@/components/SeverityBadge";

interface ReviewDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ReviewDetailsPage({
  params,
}: ReviewDetailsPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  const review = await Review.findById(id).lean();

  if (!review) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-100">
                <Sparkles className="size-3.5" />
                Review Details
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {review.language} · {review.reviewType}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <FileCode2 className="size-4" />
                  {review.language}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <ShieldCheck className="size-4" />
                  {review.reviewType}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <CalendarDays className="size-4" />
                  {formatDate(review.createdAt)}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 lg:min-w-[220px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Code Quality Score
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                {review.score}
                <span className="text-lg text-zinc-400">/100</span>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <article className="rounded-[28px] border border-white/10 bg-[#0f0f12] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Summary
              </p>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                {review.summary}
              </p>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#0f0f12] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Issues Found
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Detailed findings
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                  {review.issues.length} issues
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {review.issues.map((issue, index) => (
                  <article
                    key={`${issue.title}-${index}`}
                    className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">
                            {issue.title}
                          </h3>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <p className="mt-2 text-sm text-zinc-500">
                          {issue.lineReference}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-zinc-300">
                      {issue.description}
                    </p>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                      <span className="font-medium text-white">
                        Suggested fix:
                      </span>{" "}
                      {issue.suggestion}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-[28px] border border-white/10 bg-[#0f0f12] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Improved Code
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Suggested rewrite
                </h2>
              </div>
              <CopyCodeButton code={review.improvedCode} />
            </div>

            <pre className="mt-5 overflow-x-auto rounded-[22px] border border-white/10 bg-[#09090b] p-4 text-[13px] leading-6 text-zinc-200">
              <code>{review.improvedCode}</code>
            </pre>
          </article>
        </section>
      </div>
    </main>
  );
}
