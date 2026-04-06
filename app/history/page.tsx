import Link from "next/link";
import { ArrowLeft, ChevronRight, History, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/app/lib/db";
import Review from "@/app/models/Review";

type HistoryReview = {
  id: string;
  name: string;
  language: string;
  reviewType: string;
  score: number;
  createdAt: string;
  status: "Completed" | "Needs Attention" | "Queued";
};

function getReviewStatus(score: number): HistoryReview["status"] {
  if (score >= 85) {
    return "Completed";
  }

  if (score >= 70) {
    return "Needs Attention";
  }

  return "Queued";
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

function getReviewName(code: string, index: number) {
  const firstMeaningfulLine = code
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstMeaningfulLine) {
    return `Snippet ${index + 1}`;
  }

  return firstMeaningfulLine.slice(0, 48);
}

function formatReviewDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getReviews(): Promise<HistoryReview[]> {
  await connectToDatabase();

  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .select("_id code language reviewType score createdAt")
    .lean();

  return reviews.map((review, index) => ({
    id: String(review._id),
    name: getReviewName(review.code, index),
    language: review.language,
    reviewType: review.reviewType,
    score: review.score,
    createdAt: formatReviewDate(review.createdAt),
    status: getReviewStatus(review.score),
  }));
}

export default async function HistoryPage() {
  const reviews = await getReviews();

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-100">
                <Sparkles className="size-3.5" />
                Saved Reviews
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Review history
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Browse previous reviews, check quality scores, and open any
                saved result in the existing details view.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Total Reviews
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-100">
                  <History className="size-5" />
                </div>
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {reviews.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[26px] border border-white/10">
            <div className="hidden grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.9fr_0.9fr] gap-4 bg-white/[0.05] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid">
              <span>Snippet</span>
              <span>Language</span>
              <span>Review Type</span>
              <span>Score</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-white/10">
              {reviews.length === 0 ? (
                <div className="bg-[#0a0a0d] px-4 py-10 text-sm text-zinc-500">
                  No saved reviews yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="grid gap-3 bg-[#0a0a0d] px-4 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[1.5fr_0.9fr_1fr_0.75fr_0.9fr_0.9fr] md:items-center"
                  >
                    <div>
                      <p className="font-medium text-white">{review.name}</p>
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
        </section>
      </div>
    </main>
  );
}
