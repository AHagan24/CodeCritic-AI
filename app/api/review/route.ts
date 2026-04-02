import { NextResponse } from "next/server";
import { openai } from "../../lib/openai";
import type { ReviewResponse } from "../../types/review";

const mockResponse: ReviewResponse = {
  score: 78,
  summary:
    "This code is functional, but there are a few areas that could be improved for readability and stability.",
  issues: [
    {
      title: "Missing input validation",
      description:
        "The function assumes the input is always valid and does not guard against unexpected values.",
      severity: "high",
      lineReference: "Line 1-3",
      suggestion: "Add validation checks before processing the input.",
    },
    {
      title: "Low readability",
      description:
        "Variable names are vague and make the code harder to understand.",
      severity: "medium",
      lineReference: "Line 2",
      suggestion: "Rename variables to reflect their actual purpose.",
    },
  ],
  improvedCode:
    'function getUserName(user) {\n  if (!user?.name) return "";\n  return user.name.toUpperCase();\n}',
};

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

function getMockReviewResponse() {
  return NextResponse.json(mockResponse);
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

    // Keep public/deployed usage from burning your credits.
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === "production") {
      return getMockReviewResponse();
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
      return getMockReviewResponse();
    }

    const parsed = JSON.parse(output) as unknown;

    if (!isValidReviewResponse(parsed)) {
      console.error("AI review error: AI returned an invalid review format.");
      return getMockReviewResponse();
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown OpenAI error";

    if (errorMessage.includes("insufficient_quota")) {
      console.error("AI review error: insufficient_quota", error);
      return getMockReviewResponse();
    }

    console.error("AI review error:", error);
    return getMockReviewResponse();
  }
}
