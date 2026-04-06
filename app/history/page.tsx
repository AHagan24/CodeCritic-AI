import Link from "next/link";
import { ArrowLeft, History, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/app/lib/db";
import Review from "@/app/models/Review";
import HistoryTable, { type HistoryReview } from "@/components/HistoryTable";

function getReviewStatus(score: number): HistoryReview["status"] {
  if (score >= 85) {
    return "Completed";
  }

  if (score >= 70) {
    return "Needs Attention";
  }

  return "Queued";
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
    <main className="bg-background px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98),rgba(11,11,14,0.96))] p-6 shadow-lg sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-100">
                <Sparkles className="size-3.5" />
                Saved Reviews
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Review history
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Browse previous reviews, search by snippet or language, and open
                any saved result in the existing details view.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 lg:min-w-[220px]">
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

          {reviews.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-white/10 bg-[#0a0a0d] px-5 py-12">
              <p className="text-sm font-medium text-white">No saved reviews yet.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Run a review from the dashboard and it will appear here automatically.
              </p>
            </div>
          ) : (
            <HistoryTable reviews={reviews} />
          )}
        </section>
      </div>
    </main>
  );
}
