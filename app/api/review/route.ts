import { NextResponse } from "next/server";
import type { ReviewResponse } from "../../types/review";

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

    const mockResponse: ReviewResponse = {
      summary:
        "This code is functional, but there are a few areas that could be improved for readability and stability.",
      issues: [
        {
          title: "Missing input validation",
          description:
            "The function assumes the input is always valid and does not guard against unexpected values.",
          severity: "high" as const,
          lineReference: "Line 1-3",
          suggestion: "Add validation checks before processing the input.",
        },
        {
          title: "Low readability",
          description:
            "Variable names are vague and make the code harder to understand.",
          severity: "medium" as const,
          lineReference: "Line 2",
          suggestion: "Rename variables to reflect their actual purpose.",
        },
      ],
      improvedCode: code,
    };

    return NextResponse.json(mockResponse);
  } catch {
    return NextResponse.json(
      { error: "Failed to process review request." },
      { status: 500 },
    );
  }
}
