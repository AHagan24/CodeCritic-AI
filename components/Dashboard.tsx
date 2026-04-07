"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUpRight,
  Bot,
  ChartColumn,
  ChevronRight,
  Clock3,
  FolderCode,
  Sparkles,
  Star,
} from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import ReviewResults from "@/components/ReviewResults";
import type {
  DashboardSummary,
  ReviewResponse,
  ReviewStatus,
} from "@/app/types/review";

const defaultCode = `export async function getUserProfile(userId: string) {
  const response = await fetch("/api/users/" + userId);
  const user = await response.json();

  if (user.isAdmin == true) {
    console.log("admin user");
  }

  return {
    name: user.name,
    projects: user.projects.map((project: any) => project.title),
  };
}`;

const emptyDashboardSummary: DashboardSummary = {
  totalReviews: 0,
  averageScore: null,
  languagesReviewed: [],
  recentReviews: [],
  latestReview: null,
};

function getStatusClassName(status: ReviewStatus) {
  if (status === "Completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "Needs Attention") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

function formatAverageScore(score: number | null) {
  if (score === null) {
    return "N/A";
  }

  return score.toFixed(1);
}

type DashboardStatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof ChartColumn;
};

const DashboardStatCard = memo(function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,20,0.98),rgba(11,11,14,0.96))] p-5">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-100">
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </article>
  );
});

export default function Dashboard() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("TypeScript");
  const [reviewType, setReviewType] = useState("Full Review");
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>(
    emptyDashboardSummary,
  );
  const dashboardRequestIdRef = useRef(0);

  async function loadDashboardData() {
    const requestId = dashboardRequestIdRef.current + 1;
    dashboardRequestIdRef.current = requestId;

    try {
      setDashboardLoading(true);
      setDashboardError("");

      const response = await fetch("/api/review/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const data = (await response.json()) as DashboardSummary;

      if (requestId === dashboardRequestIdRef.current) {
        setDashboardSummary(data);
      }
    } catch (loadError) {
      console.error("Dashboard data error:", loadError);

      if (requestId === dashboardRequestIdRef.current) {
        setDashboardSummary(emptyDashboardSummary);
        setDashboardError("Dashboard data is unavailable right now.");
      }
    } finally {
      if (requestId === dashboardRequestIdRef.current) {
        setDashboardLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadDashboardData();

    return () => {
      dashboardRequestIdRef.current += 1;
    };
  }, []);

  function handleCodeChange(nextCode: string | undefined) {
    setCode(nextCode ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!code.trim()) {
      setResult(null);
      setError("Paste a code snippet to generate a review.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          reviewType,
        }),
      });

      const data = (await response.json()) as ReviewResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error || "Failed to generate AI review.",
        );
      }

      setResult(data as ReviewResponse);
      await loadDashboardData();
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  const latestReview = dashboardSummary.latestReview;
  const languagesReviewed = dashboardSummary.languagesReviewed;
  const topLanguage = languagesReviewed[0]?.language ?? "None yet";
  const statCards = [
    {
      label: "Reviews Saved",
      value: dashboardSummary.totalReviews.toString(),
      description: "Stored in MongoDB review history",
      icon: ChartColumn,
    },
    {
      label: "Average Score",
      value: formatAverageScore(dashboardSummary.averageScore),
      description:
        dashboardSummary.averageScore === null
          ? "No completed reviews yet"
          : "Across all saved reviews",
      icon: Star,
    },
    {
      label: "Languages Reviewed",
      value: languagesReviewed.length.toString(),
      description:
        languagesReviewed.length === 0
          ? "Waiting for the first saved review"
          : "Unique languages in review history",
      icon: FolderCode,
    },
    {
      label: "Most Reviewed Language",
      value: topLanguage,
      description:
        languagesReviewed[0]?.count !== undefined
          ? `${languagesReviewed[0].count} saved review${languagesReviewed[0].count === 1 ? "" : "s"}`
          : "No language data yet",
      icon: Bot,
    },
  ];

  return (
    <main className="bg-background px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(9,9,11,0.88)] shadow-lg">
          <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="min-w-0 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.95),rgba(11,11,14,0.92))] p-6 shadow-md sm:p-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-100">
                  <Sparkles className="size-3.5" />
                  AI-Powered Developer Tool
                </div>

                <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-[3.1rem]">
                  Your AI Code Reviewer
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  Analyze code for bugs, readability, security, performance, and
                  best practices in a workflow designed to feel like a serious
                  developer product from day one.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="#workspace-form"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Run New Review
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <Link
                    href="/history"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
                  >
                    View Review History
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="min-w-0 grid gap-4">
                <article className="rounded-[30px] border border-white/10 bg-[#0f0f12] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Review Overview
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        Real dashboard metrics
                      </h2>
                    </div>
                    <ChartColumn className="size-5 text-zinc-500" />
                  </div>

                  {dashboardLoading ? (
                    <p className="mt-6 text-sm text-zinc-500">
                      Loading dashboard metrics...
                    </p>
                  ) : dashboardSummary.totalReviews === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-white">
                        No saved reviews yet
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Run your first review to populate counts, average score,
                        and language coverage here.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Total Reviews
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {dashboardSummary.totalReviews}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Average Score
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {formatAverageScore(dashboardSummary.averageScore)}
                        </p>
                      </div>
                    </div>
                  )}

                  {dashboardError ? (
                    <p className="mt-4 text-sm text-amber-200">{dashboardError}</p>
                  ) : null}
                </article>

                <article className="rounded-[30px] border border-white/10 bg-[#0f0f12] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Latest Saved Review
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        Most recent result
                      </h2>
                    </div>
                    <Clock3 className="size-5 text-zinc-500" />
                  </div>

                  {dashboardLoading ? (
                    <p className="mt-5 text-sm text-zinc-500">
                      Loading latest review...
                    </p>
                  ) : latestReview ? (
                    <Link
                      href={`/reviews/${latestReview.id}`}
                      className="mt-5 block rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-white">{latestReview.name}</p>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                            latestReview.status,
                          )}`}
                        >
                          {latestReview.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-zinc-400">
                        {latestReview.language} / {latestReview.reviewType}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
                        <span>Score {latestReview.score}</span>
                        <span>{latestReview.date}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-white">
                        Nothing to show yet
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Saved review previews will appear here after the first
                        successful run.
                      </p>
                    </div>
                  )}
                </article>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <DashboardStatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  description={stat.description}
                  icon={stat.icon}
                />
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)]">
              <ReviewForm
                code={code}
                language={language}
                reviewType={reviewType}
                loading={loading}
                error={error}
                onCodeChange={handleCodeChange}
                onLanguageChange={setLanguage}
                onReviewTypeChange={setReviewType}
                onSubmit={handleSubmit}
              />
              <ReviewResults result={result} loading={loading} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
