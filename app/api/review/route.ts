import { NextResponse } from "next/server";
import { openai } from "../../lib/openai";
import type { ReviewResponse } from "../../types/review";
import { connectToDatabase } from "../../lib/db";
import Review from "../../models/Review";
import type { ReviewHistoryItem } from "../../types/review";
import { checkRateLimit } from "../../lib/rate-limit";
import { parseAndValidateReviewRequest } from "../../lib/review-request";

const REVIEW_RATE_LIMIT = {
  limit: 5,
  windowMs: 60_000,
} as const;

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function getClientIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstAddress = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstAddress) {
      return firstAddress;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function getRateLimitHeaders(rateLimit: {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}) {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(Math.max(0, rateLimit.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
    "Retry-After": String(rateLimit.retryAfterSeconds),
  };
}

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
  const allowedSeverities = new Set(["low", "medium", "high", "critical"]);

  return (
    typeof review.score === "number" &&
    review.score >= 0 &&
    review.score <= 100 &&
    typeof review.summary === "string" &&
    review.summary.trim().length > 0 &&
    typeof review.improvedCode === "string" &&
    review.improvedCode.trim().length > 0 &&
    Array.isArray(review.issues) &&
    review.issues.every(
      (issue) =>
        Boolean(issue) &&
        typeof issue.title === "string" &&
        issue.title.trim().length > 0 &&
        typeof issue.description === "string" &&
        issue.description.trim().length > 0 &&
        typeof issue.severity === "string" &&
        allowedSeverities.has(issue.severity) &&
        typeof issue.lineReference === "string" &&
        issue.lineReference.trim().length > 0 &&
        typeof issue.suggestion === "string" &&
        issue.suggestion.trim().length > 0,
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
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

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
    return jsonError("Failed to fetch recent reviews.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimitKey = `review:${ipAddress}`;
    const rateLimit = checkRateLimit(
      rateLimitKey,
      REVIEW_RATE_LIMIT.limit,
      REVIEW_RATE_LIMIT.windowMs,
    );
    const rateLimitHeaders = getRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return jsonError(
        "Too many review requests. Please try again shortly.",
        429,
        rateLimitHeaders,
      );
    }

    const validationResult = await parseAndValidateReviewRequest(request);

    if (!validationResult.success) {
      return jsonError(
        validationResult.error,
        validationResult.status,
        rateLimitHeaders,
      );
    }

    const { code, language, reviewType } = validationResult.data;

    // Keep local/dev usage from burning your credits.
    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== "production") {
      return jsonError(
        "AI review service is not configured.",
        503,
        rateLimitHeaders,
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("AI review error: OPENAI_API_KEY is not configured.");
      return jsonError(
        "AI review service is not configured.",
        503,
        rateLimitHeaders,
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
      return jsonError("No AI review was returned.", 502, rateLimitHeaders);
    }

    const parsed = parseReviewResponse(output);

    if (!parsed) {
      console.error("AI review error: AI returned an invalid review format.");
      return jsonError(
        "AI review returned an invalid response.",
        502,
        rateLimitHeaders,
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

    return NextResponse.json(
      {
        ...parsed,
        language,
        reviewType,
      },
      {
        headers: rateLimitHeaders,
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown OpenAI error";

    if (errorMessage.includes("insufficient_quota")) {
      console.error("AI review error: insufficient_quota", error);
      return jsonError("AI review quota has been exceeded.", 503);
    }

    if (errorMessage.toLowerCase().includes("rate limit")) {
      console.error("AI review upstream rate limit:", error);
      return jsonError("AI review service is temporarily busy.", 503);
    }

    console.error("AI review error:", error);
    return jsonError("Failed to generate AI review.", 500);
  }
}
