import { NextResponse } from "next/server";
import { openai } from "../../lib/openai";
import type { ReviewResponse } from "../../types/review";
import { connectToDatabase } from "../../lib/db";
import Review from "../../models/Review";
import type { ReviewHistoryItem } from "../../types/review";

const reviewSchema = {
  name: "code_review",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description:
          "Overall code quality score from 0 to 100 based on correctness, readability, maintainability, and risk.",
      },
      summary: {
        type: "string",
        description: "A concise summary of the overall review.",
      },
      issues: {
        type: "array",
        description: "A list of issues found in the code.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: {
              type: "string",
              description: "Short issue title.",
            },
            description: {
              type: "string",
              description: "What is wrong and why it matters.",
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            lineReference: {
              type: "string",
              description:
                "Approximate line number or range, like 'Line 4' or 'Line 8-10'.",
            },
            suggestion: {
              type: "string",
              description: "A concrete fix suggestion.",
            },
          },
          required: [
            "title",
            "description",
            "severity",
            "lineReference",
            "suggestion",
          ],
        },
      },
      improvedCode: {
        type: "string",
        description: "An improved version of the submitted code.",
      },
    },
    required: ["score", "summary", "issues", "improvedCode"],
  },
} as const;

function isValidReviewResponse(value: unknown): value is ReviewResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const review = value as ReviewResponse;

  return (
    typeof review.score === "number" &&
    review.score >= 0 &&
    review.score <= 100 &&
    typeof review.summary === "string" &&
    typeof review.improvedCode === "string" &&
    Array.isArray(review.issues) &&
    review.issues.every(
      (issue) =>
        issue &&
        typeof issue.title === "string" &&
        typeof issue.description === "string" &&
        typeof issue.severity === "string" &&
        typeof issue.lineReference === "string" &&
        typeof issue.suggestion === "string",
    )
  );
}

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

function parseReviewResponse(value: string): ReviewResponse | null {
  const parsed: unknown = JSON.parse(value);

  if (!isValidReviewResponse(parsed)) {
    return null;
  }

  return parsed;
}

export async function GET() {
  try {
    await connectToDatabase();

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id code language reviewType score createdAt")
      .lean();

    const recentReviews: ReviewHistoryItem[] = reviews.map((review, index) => ({
      id: String(review._id),
      name: getReviewName(review.code, index),
      language: review.language,
      reviewType: review.reviewType,
      score: review.score,
      date: formatReviewDate(review.createdAt),
      status: getReviewStatus(review.score),
    }));

    return NextResponse.json(recentReviews);
  } catch (error) {
    console.error("Recent reviews error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recent reviews",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, language, reviewType } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Language is required." },
        { status: 400 },
      );
    }

    if (!reviewType || typeof reviewType !== "string") {
      return NextResponse.json(
        { error: "Review type is required." },
        { status: 400 },
      );
    }

    // Keep local/dev usage from burning your credits.
    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "AI review service is not configured." },
        { status: 503 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("AI review error: OPENAI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "AI review service is not configured." },
        { status: 500 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer performing a code review. Be precise, practical, and concise. Focus on actionable feedback. Include a realistic score from 0 to 100 where 90-100 is excellent, 70-89 is good, 50-69 has moderate issues, and below 50 is poor quality.",
        },
        {
          role: "user",
          content: `Review the following ${language} code for: ${reviewType}.

Return JSON that matches the provided schema.
Include a realistic numeric score from 0 to 100 for the overall code quality.

Code:
${code}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: reviewSchema,
      },
    });

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      console.error("AI review error: No AI response was returned.");
      return NextResponse.json(
        { error: "No AI review was returned." },
        { status: 502 },
      );
    }

    const parsed = parseReviewResponse(output);

    if (!parsed) {
      console.error("AI review error: AI returned an invalid review format.");
      return NextResponse.json(
        { error: "AI review returned an invalid response." },
        { status: 502 },
      );
    }

    await connectToDatabase();

    await Review.create({
      code,
      language,
      reviewType,
      score: parsed.score,
      summary: parsed.summary,
      issues: parsed.issues,
      improvedCode: parsed.improvedCode,
    });

    return NextResponse.json({
      ...parsed,
      language,
      reviewType,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown OpenAI error";

    if (errorMessage.includes("insufficient_quota")) {
      console.error("AI review error: insufficient_quota", error);
      return NextResponse.json(
        { error: "AI review quota has been exceeded." },
        { status: 503 },
      );
    }

    console.error("AI review error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI review." },
      { status: 500 },
    );
  }
}
