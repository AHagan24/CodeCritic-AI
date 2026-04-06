"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

export type HistoryReview = {
  id: string;
  name: string;
  language: string;
  reviewType: string;
  score: number;
  createdAt: string;
  status: "Completed" | "Needs Attention" | "Queued";
};

interface HistoryTableProps {
  reviews: HistoryReview[];
}

function getStatusClassName(status: HistoryReview["status"]) {
  if (status === "Completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "Needs Attention") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

function getSelectClassName() {
  return "h-11 w-full appearance-none rounded-2xl border border-white/10 bg-[#0d0d10] px-4 text-sm text-zinc-100 outline-none transition-[border-color,background-color,box-shadow] focus:border-white/20 focus:bg-[#0b0b0e] focus:ring-2 focus:ring-white/5";
}

export default function HistoryTable({ reviews }: HistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All languages");
  const [reviewTypeFilter, setReviewTypeFilter] = useState("All review types");

  const languageOptions = useMemo(
    () => [
      "All languages",
      ...Array.from(new Set(reviews.map((review) => review.language))).sort(),
    ],
    [reviews],
  );

  const reviewTypeOptions = useMemo(
    () => [
      "All review types",
      ...Array.from(new Set(reviews.map((review) => review.reviewType))).sort(),
    ],
    [reviews],
  );

  const filteredReviews = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        review.name.toLowerCase().includes(normalizedQuery) ||
        review.language.toLowerCase().includes(normalizedQuery) ||
        review.reviewType.toLowerCase().includes(normalizedQuery);

      const matchesLanguage =
        languageFilter === "All languages" ||
        review.language === languageFilter;

      const matchesReviewType =
        reviewTypeFilter === "All review types" ||
        review.reviewType === reviewTypeFilter;

      return matchesSearch && matchesLanguage && matchesReviewType;
    });
  }, [languageFilter, reviewTypeFilter, reviews, searchTerm]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    languageFilter !== "All languages" ||
    reviewTypeFilter !== "All review types";

  return (
    <div className="mt-8">
      <div className="rounded-[28px] border border-white/10 bg-[#0a0a0d] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <SlidersHorizontal className="size-3.5" />
              Filters
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Search snippet names and narrow by language or review type.
            </p>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setLanguageFilter("All languages");
                setReviewTypeFilter("All review types");
              }}
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.85fr_0.9fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search snippets, languages, or review types"
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#0d0d10] pl-11 pr-4 text-sm text-zinc-100 outline-none transition-[border-color,background-color,box-shadow] placeholder:text-zinc-600 focus:border-white/20 focus:bg-[#0b0b0e] focus:ring-2 focus:ring-white/5"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Language
            </span>
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value)}
              className={getSelectClassName()}
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Review Type
            </span>
            <select
              value={reviewTypeFilter}
              onChange={(event) => setReviewTypeFilter(event.target.value)}
              className={getSelectClassName()}
            >
              {reviewTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[26px] border border-white/10">
        <div className="hidden grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.9fr_0.9fr] gap-4 bg-white/[0.05] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid">
          <span>Snippet</span>
          <span>Language</span>
          <span>Review Type</span>
          <span>Score</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-white/10">
          {filteredReviews.length === 0 ? (
            <div className="bg-[#0a0a0d] px-5 py-12">
              <p className="text-sm font-medium text-white">
                No reviews match the current filters.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try widening the search or clearing one of the filters.
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="grid gap-3 bg-[#0a0a0d] px-5 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.9fr_0.9fr] md:items-center"
              >
                <div>
                  <p className="font-medium text-white">{review.name}</p>
                  <p className="mt-1 text-sm text-zinc-500 md:hidden">
                    {review.language} / {review.reviewType}
                  </p>
                </div>
                <p className="hidden text-sm text-zinc-300 md:block">
                  {review.language}
                </p>
                <p className="hidden text-sm text-zinc-300 md:block">
                  {review.reviewType}
                </p>
                <p className="text-sm font-medium text-white">{review.score}</p>
                <p className="text-sm text-zinc-400">{review.createdAt}</p>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                      review.status,
                    )}`}
                  >
                    {review.status}
                  </span>
                  <ChevronRight className="size-4 text-zinc-600 md:hidden" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
