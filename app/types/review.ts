export type Severity = "low" | "medium" | "high" | "critical";

export interface ReviewIssue {
  category?: string;
  title: string;
  description: string;
  severity: Severity;
  lineReference: string;
  suggestion: string;
}

export type ReviewStatus = "Completed" | "Needs Attention" | "Queued";

export interface ReviewResponse {
  score: number;
  summary: string;
  issues: ReviewIssue[];
  improvedCode: string;
  language?: string;
  reviewType?: string;
}

export interface ReviewHistoryItem {
  id: string;
  name: string;
  language: string;
  reviewType: string;
  score: number;
  date: string;
  status: ReviewStatus;
}

export interface LanguageReviewCount {
  language: string;
  count: number;
}

export interface DashboardSummary {
  totalReviews: number;
  averageScore: number | null;
  languagesReviewed: LanguageReviewCount[];
  recentReviews: ReviewHistoryItem[];
  latestReview: ReviewHistoryItem | null;
}
