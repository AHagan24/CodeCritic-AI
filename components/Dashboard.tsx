"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, ChevronRight, Minus, Sparkles } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import ReviewResults from "@/components/ReviewResults";
import {
  activity,
  activityHeights,
  categories,
  defaultCode,
  languageDistribution,
  navItems,
  stats,
} from "@/components/dashboard/mockData";
import type {
  ReviewHistoryItem,
  ReviewResponse,
  ReviewStatus,
} from "@/app/types/review";
import codeCriticLogo from "../assets/CodeCriticLogo.png";

function getStatusClassName(status: ReviewStatus) {
  if (status === "Completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "Needs Attention") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

const DashboardNav = memo(function DashboardNav() {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {navItems.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm duration-150 transition-colors ${
            item.active
              ? "bg-white text-black shadow-[0_6px_18px_rgba(255,255,255,0.06)]"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <item.icon className="size-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
});

const ActivityBars = memo(function ActivityBars() {
  return (
    <div className="mt-6 flex h-24 items-end gap-2">
      {activityHeights.map((height, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-full bg-[linear-gradient(180deg,rgba(244,244,245,0.88),rgba(56,189,248,0.16))]"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
});

export default function Dashboard() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("TypeScript");
  const [reviewType, setReviewType] = useState("Full Review");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewHistoryItem[]>([]);
  const recentReviewsRequestIdRef = useRef(0);

  async function loadRecentReviews() {
    const requestId = recentReviewsRequestIdRef.current + 1;
    recentReviewsRequestIdRef.current = requestId;

    try {
      setHistoryLoading(true);

      const response = await fetch("/api/review");

      if (!response.ok) {
        throw new Error("Failed to load review history.");
      }

      const data = (await response.json()) as ReviewHistoryItem[];

      if (requestId === recentReviewsRequestIdRef.current) {
        setRecentReviews(data);
      }
    } catch (error) {
      console.error("Review history error:", error);

      if (requestId === recentReviewsRequestIdRef.current) {
        setRecentReviews([]);
      }
    } finally {
      if (requestId === recentReviewsRequestIdRef.current) {
        setHistoryLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadRecentReviews();

    return () => {
      recentReviewsRequestIdRef.current += 1;
    };
  }, []);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI review.");
      }

      setResult(data);
      await loadRecentReviews();
    } catch (error) {
      setResult(null);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(9,9,11,0.9)] shadow-lg">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-2 shadow-inner shadow-white/[0.04]">
                  <Image
                    src={codeCriticLogo}
                    alt="CodeCritic AI logo"
                    className="h-auto max-h-7 w-auto object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">
                    CodeCritic AI
                  </p>
                  <p className="text-sm text-zinc-500">
                    Premium AI review workspace for shipping better code
                  </p>
                </div>
              </div>

              <DashboardNav />

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-400 md:block">
                  Workspace: Personal Sandbox
                </div>
                <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,#f4f4f5,#71717a)] text-sm font-semibold text-black">
                  AC
                </div>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.95),rgba(11,11,14,0.92))] p-6 shadow-md">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-100">
                  <Sparkles className="size-3.5" />
                  AI-Powered Developer Tool
                </div>

                <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-[3.25rem]">
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black duration-150 transition-colors hover:bg-zinc-200"
                  >
                    Run New Review
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <Link
                    href="#recent-reviews"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-200 duration-150 transition-colors hover:bg-white/10"
                  >
                    View Recent Reviews
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <article className="rounded-[30px] border border-white/10 bg-[#0f0f12] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Review Activity
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        Weekly throughput is trending up
                      </h2>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                      +14%
                    </span>
                  </div>

                  <ActivityBars />

                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    Critical findings are stabilizing while review volume
                    continues climbing across TypeScript-heavy submissions.
                  </p>
                </article>

                <article className="rounded-[30px] border border-white/10 bg-[#0f0f12] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Activity Feed
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        Workspace pulse
                      </h2>
                    </div>
                    <Minus className="size-4 text-zinc-600" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {activity.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3"
                      >
                        <span className="mt-1 size-2 rounded-full bg-sky-300" />
                        <p className="text-sm leading-6 text-zinc-300">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,20,0.98),rgba(11,11,14,0.96))] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-100">
                      <stat.icon className="size-5" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                      {stat.delta}
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-zinc-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {stat.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.04fr]">
              <ReviewForm
                code={code}
                language={language}
                reviewType={reviewType}
                loading={loading}
                error={error}
                onCodeChange={setCode}
                onLanguageChange={setLanguage}
                onReviewTypeChange={setReviewType}
                onSubmit={handleSubmit}
              />
              <ReviewResults result={result} loading={loading} />
            </section>

            <section
              id="recent-reviews"
              className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Recent Reviews
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Review history
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                      All Languages
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                      Last 7 Days
                    </span>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[26px] border border-white/10">
                  <div className="hidden grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.85fr_0.9fr] gap-4 bg-white/[0.05] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid">
                    <span>Snippet</span>
                    <span>Language</span>
                    <span>Review Type</span>
                    <span>Score</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>

                  <div className="divide-y divide-white/10">
                    {historyLoading ? (
                      <div className="bg-[#0a0a0d] px-4 py-8 text-sm text-zinc-500">
                        Loading recent reviews...
                      </div>
                    ) : recentReviews.length === 0 ? (
                      <div className="bg-[#0a0a0d] px-4 py-8 text-sm text-zinc-500">
                        No saved reviews yet.
                      </div>
                    ) : (
                      recentReviews.map((review) => (
                        <article
                          key={review.id}
                          className="grid gap-3 bg-[#0a0a0d] px-4 py-4 md:grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.85fr_0.9fr] md:items-center"
                        >
                          <div>
                            <p className="font-medium text-white">
                              {review.name}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 md:hidden">
                              {review.language} · {review.reviewType}
                            </p>
                          </div>
                          <p className="hidden text-sm text-zinc-300 md:block">
                            {review.language}
                          </p>
                          <p className="hidden text-sm text-zinc-300 md:block">
                            {review.reviewType}
                          </p>
                          <p className="text-sm font-medium text-white">
                            {review.score}
                          </p>
                          <p className="text-sm text-zinc-400">{review.date}</p>
                          <div>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                                review.status,
                              )}`}
                            >
                              {review.status}
                            </span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Common Issue Categories
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        Where reviews cluster most
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      Last 30 days
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {categories.map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-zinc-300">{category.name}</span>
                          <span className="text-zinc-500">
                            {category.count}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(244,244,245,0.95),rgba(56,189,248,0.45))]"
                            style={{ width: `${category.count * 5}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Language Distribution
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    Review mix by stack
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {languageDistribution.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    TypeScript service-layer code still drives the highest
                    volume, with Python utilities and Go handlers following
                    behind.
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
