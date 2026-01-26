import { NextResponse } from "next/server";
import { GithubApiError } from "./client";

/**
 * Create a secure error response that never exposes sensitive data.
 *
 * SECURITY: This function sanitizes error details to prevent token exposure.
 */
export const apiErrorResponse = (error: unknown, fallbackMessage = "GitHub request failed.") => {
  if (error instanceof GithubApiError) {
    let sanitizedDetails: unknown = undefined;

    if (error.details) {
      const detailsStr = JSON.stringify(error.details);
      const sanitized = detailsStr
        .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED]")
        .replace(/gho_[a-zA-Z0-9]{36}/g, "[REDACTED]")
        .replace(/github_pat_[a-zA-Z0-9_]{82}/g, "[REDACTED]")
        .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED]");

      try {
        sanitizedDetails = JSON.parse(sanitized);
      } catch {
        sanitizedDetails = { message: "Error details unavailable" };
      }
    }

    if (error.status === 403 || error.status === 429) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please try again later or add a GitHub token for higher limits.",
          retryAfter: error.status === 429 ? "60" : undefined,
        },
        {
          status: error.status,
          headers: error.status === 429 ? { "Retry-After": "60" } : undefined,
        }
      );
    }

    return NextResponse.json(
      { error: error.message, details: sanitizedDetails },
      { status: error.status }
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
};
