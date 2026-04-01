import type { ReviewHistoryItem, ReviewResponse } from "@/app/types/review";
import {
  Bot,
  ChartColumn,
  Clock3,
  FolderCode,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Star,
} from "lucide-react";

export const defaultCode = `export async function getUserProfile(userId: string) {
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

export const mockReviewByType: Record<
  string,
  Omit<ReviewResponse, "language" | "reviewType">
> = {
  "Full Review": {
    score: 82,
    summary:
      "The snippet is functionally clear, but it mixes loose typing, missing response guards, and a few readability gaps that would increase risk in production code.",
    issues: [
      {
        title: "Unchecked API response",
        category: "Bug Risk",
        severity: "high",
        description:
          "The fetch call assumes both success status and valid JSON, which can surface runtime failures and confusing UI states when the upstream request fails.",
        lineReference: "Lines 2-3",
        suggestion:
          "Check `response.ok`, handle parsing failures gracefully, and return a typed fallback shape before reading user properties.",
      },
      {
        title: "Loose equality and noisy logging",
        category: "Best Practices",
        severity: "medium",
        description:
          "The admin flag uses loose comparison and leaves a console statement in the execution path, which can hide subtle coercion bugs and leak internal behavior.",
        lineReference: "Lines 5-6",
        suggestion:
          "Use strict boolean checks and move operational logging to a structured logger or development-only utility.",
      },
      {
        title: "Unbounded `any` in collection mapping",
        category: "Readability",
        severity: "medium",
        description:
          "Using `any` inside the project mapper weakens editor feedback and makes the return shape harder to trust as the API evolves.",
        lineReference: "Line 11",
        suggestion:
          "Introduce a small `UserProject` type so the mapped fields are explicit and future refactors stay safe.",
      },
    ],
    improvedCode: `type UserProject = {
  title: string;
};

type UserProfileResponse = {
  name: string;
  isAdmin: boolean;
  projects: UserProject[];
};

export async function getUserProfile(userId: string) {
  const response = await fetch(\`/api/users/\${userId}\`);

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const user: UserProfileResponse = await response.json();
  const projectTitles = user.projects.map((project) => project.title);

  return {
    name: user.name,
    isAdmin: user.isAdmin,
    projects: projectTitles,
  };
}`,
  },
  "Security Audit": {
    score: 76,
    summary:
      "The code is small, but it still trusts remote data too easily and exposes a few patterns that would deserve hardening before shipping to production.",
    issues: [
      {
        title: "Remote data trusted without validation",
        category: "Security",
        severity: "high",
        description:
          "The function consumes a remote payload directly and assumes the expected structure, which increases the blast radius of malformed or hostile responses.",
        lineReference: "Lines 3-12",
        suggestion:
          "Validate the response shape before using it and fail closed when required fields are missing.",
      },
      {
        title: "Role branching without explicit contract",
        category: "Security",
        severity: "medium",
        description:
          "Checking administrative state inline can create hidden authorization assumptions if the same data path is later reused by UI or business logic.",
        lineReference: "Lines 5-7",
        suggestion:
          "Return the role data as typed state and keep permission decisions in a dedicated auth boundary.",
      },
    ],
    improvedCode: `type UserProfileResponse = {
  name: string;
  isAdmin: boolean;
  projects: Array<{ title: string }>;
};

function isUserProfileResponse(value: unknown): value is UserProfileResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as UserProfileResponse;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.isAdmin === "boolean" &&
    Array.isArray(candidate.projects)
  );
}

export async function getUserProfile(userId: string) {
  const response = await fetch(\`/api/users/\${userId}\`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const payload: unknown = await response.json();

  if (!isUserProfileResponse(payload)) {
    throw new Error("Unexpected user profile response");
  }

  return {
    name: payload.name,
    isAdmin: payload.isAdmin,
    projects: payload.projects.map((project) => project.title),
  };
}`,
  },
  "Performance Pass": {
    score: 88,
    summary:
      "This snippet is already lightweight, but a few small cleanup decisions improve runtime predictability and reduce unnecessary work in hot paths.",
    issues: [
      {
        title: "Inline mapping on raw payload",
        category: "Performance",
        severity: "low",
        description:
          "The transformation is small, but isolating the mapped collection improves maintainability and makes memoization or reuse easier later.",
        lineReference: "Line 11",
        suggestion:
          "Store the mapped project titles in a named variable and avoid repeated transformation if the object grows.",
      },
    ],
    improvedCode: `type UserProfileResponse = {
  name: string;
  projects: Array<{ title: string }>;
};

export async function getUserProfile(userId: string) {
  const response = await fetch(\`/api/users/\${userId}\`);

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const user: UserProfileResponse = await response.json();
  const projects = user.projects.map((project) => project.title);

  return {
    name: user.name,
    projects,
  };
}`,
  },
  "Readability Check": {
    score: 84,
    summary:
      "The logic is short and approachable, but clearer typing and better naming would make the function easier for a team to maintain over time.",
    issues: [
      {
        title: "Ambiguous payload typing",
        category: "Readability",
        severity: "medium",
        description:
          "The shape of `user` and each project item must be inferred mentally, which slows review and makes future edits riskier.",
        lineReference: "Lines 3-11",
        suggestion:
          "Add named response types and extract transformations into clear intermediate variables.",
      },
    ],
    improvedCode: `type UserProject = { title: string };
type UserProfileResponse = {
  name: string;
  isAdmin: boolean;
  projects: UserProject[];
};

export async function getUserProfile(userId: string) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const user: UserProfileResponse = await response.json();
  const projectTitles = user.projects.map((project) => project.title);

  return {
    name: user.name,
    projects: projectTitles,
  };
}`,
  },
  "Bug Risk Scan": {
    score: 79,
    summary:
      "The main bug risk comes from assuming happy-path network behavior and consuming fields before verifying the backend actually returned a valid object.",
    issues: [
      {
        title: "Missing response status guard",
        category: "Bug Risk",
        severity: "high",
        description:
          "A failing request still moves into JSON parsing and property access, which can create hard-to-debug runtime exceptions.",
        lineReference: "Lines 2-4",
        suggestion:
          "Guard against non-successful responses and throw a descriptive error before parsing.",
      },
    ],
    improvedCode: `type UserProfileResponse = {
  name: string;
  projects: Array<{ title: string }>;
};

export async function getUserProfile(userId: string) {
  const response = await fetch(\`/api/users/\${userId}\`);

  if (!response.ok) {
    throw new Error("Could not load user profile");
  }

  const user: UserProfileResponse = await response.json();

  return {
    name: user.name,
    projects: user.projects.map((project) => project.title),
  };
}`,
  },
};

export const stats = [
  {
    label: "Reviews Completed",
    value: "1,284",
    delta: "+18.4%",
    description: "This month",
    icon: ChartColumn,
  },
  {
    label: "Critical Issues Found",
    value: "47",
    delta: "-12.1%",
    description: "Last 30 days",
    icon: ShieldAlert,
  },
  {
    label: "Avg Review Score",
    value: "84.6",
    delta: "+4.3 pts",
    description: "Across teams",
    icon: Star,
  },
  {
    label: "Most Reviewed Language",
    value: "TypeScript",
    delta: "42%",
    description: "Of submissions",
    icon: FolderCode,
  },
];

export const recentReviews: ReviewHistoryItem[] = [
  {
    id: "1",
    name: "auth-service.ts",
    language: "TypeScript",
    reviewType: "Security Audit",
    score: 78,
    date: "Apr 1, 2026",
    status: "Needs Attention",
  },
  {
    id: "2",
    name: "billing-webhook.ts",
    language: "Node.js",
    reviewType: "Full Review",
    score: 91,
    date: "Mar 31, 2026",
    status: "Completed",
  },
  {
    id: "3",
    name: "useCheckout.ts",
    language: "TypeScript",
    reviewType: "Performance Pass",
    score: 86,
    date: "Mar 31, 2026",
    status: "Completed",
  },
  {
    id: "4",
    name: "permissions.py",
    language: "Python",
    reviewType: "Bug Risk Scan",
    score: 73,
    date: "Mar 30, 2026",
    status: "Needs Attention",
  },
];

export const activity = [
  "14 new reviews generated in the last 24 hours",
  "Security findings dropped 12% after the latest cleanup sprint",
  "TypeScript snippets now make up the highest review volume",
];

export const categories = [
  { name: "Input Validation", count: 18 },
  { name: "Error Handling", count: 14 },
  { name: "Type Safety", count: 11 },
  { name: "Performance", count: 8 },
];

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Reviews", icon: Bot, active: false },
  { label: "History", icon: Clock3, active: false },
  { label: "Settings", icon: Settings, active: false },
];
