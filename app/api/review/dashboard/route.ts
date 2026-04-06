import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Review from "@/app/models/Review";
import type { DashboardSummary, ReviewHistoryItem } from "@/app/types/review";

function getReviewStatus(score: number): ReviewHistoryItem["status"] {
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

export async function GET() {
  try {
    await connectToDatabase();

    const [totalReviews, averageScoreResult, languagesReviewedResult, reviews] =
      await Promise.all([
        Review.countDocuments(),
        Review.aggregate<{ averageScore: number }>([
          {
            $group: {
              _id: null,
              averageScore: { $avg: "$score" },
            },
          },
        ]),
        Review.aggregate<{ _id: string; count: number }>([
          {
            $group: {
              _id: "$language",
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },
        ]),
        Review.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("_id code language reviewType score createdAt")
          .lean(),
      ]);

    const recentReviews: ReviewHistoryItem[] = reviews.map((review, index) => ({
      id: String(review._id),
      name: getReviewName(review.code, index),
      language: review.language,
      reviewType: review.reviewType,
      score: review.score,
      date: formatReviewDate(review.createdAt),
      status: getReviewStatus(review.score),
    }));

    const dashboardSummary: DashboardSummary = {
      totalReviews,
      averageScore:
        averageScoreResult[0]?.averageScore === undefined
          ? null
          : Number(averageScoreResult[0].averageScore),
      languagesReviewed: languagesReviewedResult.map((entry) => ({
        language: entry._id,
        count: entry.count,
      })),
      recentReviews,
      latestReview: recentReviews[0] ?? null,
    };

    return NextResponse.json(dashboardSummary);
  } catch (error) {
    console.error("Dashboard summary error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
