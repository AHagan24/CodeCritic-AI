export const MAX_REQUEST_BYTES = 60_000;
const MAX_CODE_LENGTH = 40_000;
const MAX_FIELD_LENGTH = 60;
const REQUIRED_FIELDS = ["code", "language", "reviewType"] as const;

const allowedLanguages = new Set([
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
]);

const allowedReviewTypes = new Set([
  "Full Review",
  "Security Audit",
  "Performance Pass",
  "Readability Check",
  "Bug Risk Scan",
]);

type ReviewRequestBody = {
  code: string;
  language: string;
  reviewType: string;
};

type ValidationSuccess = {
  success: true;
  data: ReviewRequestBody;
};

type ValidationFailure = {
  success: false;
  status: number;
  error: string;
};

export type ReviewRequestValidationResult =
  | ValidationSuccess
  | ValidationFailure;

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function sanitizeShortText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function getByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function parseContentLength(value: string | null) {
  if (value === null) {
    return { success: true as const, value: null };
  }

  if (!/^\d+$/.test(value)) {
    return { success: false as const };
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    return { success: false as const };
  }

  return { success: true as const, value: parsed };
}

export async function parseAndValidateReviewRequest(
  request: Request,
): Promise<ReviewRequestValidationResult> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      success: false,
      status: 415,
      error: "Requests must use application/json.",
    };
  }

  const parsedContentLength = parseContentLength(
    request.headers.get("content-length"),
  );

  if (!parsedContentLength.success) {
    return {
      success: false,
      status: 400,
      error: "Content-Length header is invalid.",
    };
  }

  if (
    parsedContentLength.value !== null &&
    parsedContentLength.value > MAX_REQUEST_BYTES
  ) {
    return {
      success: false,
      status: 413,
      error: "Request payload is too large.",
    };
  }

  let rawBody = "";

  try {
    rawBody = await request.text();
  } catch {
    return {
      success: false,
      status: 400,
      error: "Request body could not be read.",
    };
  }

  if (!rawBody.trim()) {
    return {
      success: false,
      status: 400,
      error: "Request body is required.",
    };
  }

  if (getByteLength(rawBody) > MAX_REQUEST_BYTES) {
    return {
      success: false,
      status: 413,
      error: "Request payload is too large.",
    };
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return {
      success: false,
      status: 400,
      error: "Malformed JSON payload.",
    };
  }

  if (!isPlainObject(parsedBody)) {
    return {
      success: false,
      status: 400,
      error: "Request body must be a JSON object.",
    };
  }

  const { code, language, reviewType } = parsedBody;
  const unexpectedFields = Object.keys(parsedBody).filter(
    (key) =>
      !REQUIRED_FIELDS.includes(
        key as (typeof REQUIRED_FIELDS)[number],
      ),
  );

  if (unexpectedFields.length > 0) {
    return {
      success: false,
      status: 400,
      error: "Request body contains unsupported fields.",
    };
  }

  if (typeof code !== "string" || !code.trim()) {
    return {
      success: false,
      status: 400,
      error: "Code is required.",
    };
  }

  if (code.length > MAX_CODE_LENGTH) {
    return {
      success: false,
      status: 413,
      error: "Code snippet is too large.",
    };
  }

  if (typeof language !== "string") {
    return {
      success: false,
      status: 400,
      error: "Language is required.",
    };
  }

  if (typeof reviewType !== "string") {
    return {
      success: false,
      status: 400,
      error: "Review type is required.",
    };
  }

  const sanitizedLanguage = sanitizeShortText(language);
  const sanitizedReviewType = sanitizeShortText(reviewType);

  if (
    !sanitizedLanguage ||
    sanitizedLanguage.length > MAX_FIELD_LENGTH ||
    !allowedLanguages.has(sanitizedLanguage)
  ) {
    return {
      success: false,
      status: 400,
      error: "Language is invalid.",
    };
  }

  if (
    !sanitizedReviewType ||
    sanitizedReviewType.length > MAX_FIELD_LENGTH ||
    !allowedReviewTypes.has(sanitizedReviewType)
  ) {
    return {
      success: false,
      status: 400,
      error: "Review type is invalid.",
    };
  }

  return {
    success: true,
    data: {
      code: normalizeLineEndings(code).trim(),
      language: sanitizedLanguage,
      reviewType: sanitizedReviewType,
    },
  };
}
