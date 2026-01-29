import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { PullRequestItem, PRAnalytics } from "@/lib/github/types";

type PRReview = {
  user: { login: string } | null;
  submitted_at: string;
  state: string;
};

type PRDetail = PullRequestItem & {
  additions?: number;
  deletions?: number;
  changed_files?: number;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  reviews: PRReview[];
};

/**
 * Calculate time difference in hours
 */
function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

/**
 * Get PR size category
 */
function getPRSize(additions: number, deletions: number): "small" | "medium" | "large" {
  const total = additions + deletions;
  if (total < 100) return "small";
  if (total < 500) return "medium";
  return "large";
}

/**
 * API route for fetching advanced PR analytics
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo || typeof owner !== "string" || typeof repo !== "string") {
    return NextResponse.json({ error: "Missing owner or repo query param." }, { status: 400 });
  }

  const sanitizedOwner = owner.trim().replace(/[^a-zA-Z0-9-]/g, "");
  const sanitizedRepo = repo.trim().replace(/[^a-zA-Z0-9._-]/g, "");

  if (
    sanitizedOwner.length === 0 ||
    sanitizedOwner.length > 39 ||
    sanitizedRepo.length === 0 ||
    sanitizedRepo.length > 100
  ) {
    return NextResponse.json({ error: "Invalid owner or repo format." }, { status: 400 });
  }

  try {
    const prs = await githubJson<PullRequestItem[]>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/pulls?state=all&per_page=100&sort=updated`
    );

    if (prs.length === 0) {
      const emptyAnalytics: PRAnalytics = {
        mergeTimeDistribution: [],
        averageReviewTurnaroundTime: 0,
        prSizeAnalysis: { small: 0, medium: 0, large: 0 },
        activeReviewers: [],
        successRate: 0,
        totalPRs: 0,
        mergedPRs: 0,
        closedPRs: 0,
        openPRs: 0,
      };
      return NextResponse.json(emptyAnalytics);
    }

    const prsToAnalyze = prs.slice(0, 50);
    const prDetailsPromises = prsToAnalyze.map(async (pr) => {
      try {
        const [prDetail, reviews] = await Promise.all([
          githubJson<Omit<PRDetail, "reviews">>(
            `/repos/${sanitizedOwner}/${sanitizedRepo}/pulls/${pr.number}`
          ),
          githubJson<PRReview[]>(
            `/repos/${sanitizedOwner}/${sanitizedRepo}/pulls/${pr.number}/reviews`
          ).catch(() => [] as PRReview[]),
        ]);
        return { ...prDetail, reviews } as PRDetail;
      } catch {
        return null;
      }
    });

    const prDetails = (await Promise.all(prDetailsPromises)).filter(
      (pr): pr is PRDetail => pr !== null && pr !== undefined
    );

    const mergeTimes: number[] = [];
    prDetails.forEach((pr) => {
      if (pr.merged_at && pr.created_at) {
        const hours = hoursBetween(pr.created_at, pr.merged_at);
        mergeTimes.push(hours);
      }
    });

    const mergeTimeRanges = [
      { range: "0-24h", min: 0, max: 24 },
      { range: "1-7d", min: 24, max: 168 },
      { range: "1-4w", min: 168, max: 672 },
      { range: "1-3m", min: 672, max: 2160 },
      { range: "3m+", min: 2160, max: Infinity },
    ];

    const mergeTimeDistribution = mergeTimeRanges.map((range) => ({
      range: range.range,
      count: mergeTimes.filter((time) => time >= range.min && time < range.max).length,
    }));

    const prSizeAnalysis = {
      small: 0,
      medium: 0,
      large: 0,
    };

    prDetails.forEach((pr) => {
      const additions = pr.additions || 0;
      const deletions = pr.deletions || 0;
      const size = getPRSize(additions, deletions);
      prSizeAnalysis[size]++;
    });

    const reviewTimes: number[] = [];
    prDetails.forEach((pr) => {
      if (pr.reviews && pr.reviews.length > 0 && pr.created_at) {
        const sortedReviews = pr.reviews
          .filter((r) => r.submitted_at)
          .sort(
            (a, b) => new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime()
          );

        if (sortedReviews.length > 0 && sortedReviews[0].submitted_at) {
          const hours = hoursBetween(pr.created_at, sortedReviews[0].submitted_at);
          if (hours > 0 && hours < 720) {
            reviewTimes.push(hours);
          }
        }
      }
    });

    const averageReviewTurnaroundTime =
      reviewTimes.length > 0
        ? reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length
        : 0;

    const reviewerMap = new Map<string, number>();
    prDetails.forEach((pr) => {
      if (pr.reviews) {
        pr.reviews.forEach((review) => {
          if (review.user?.login) {
            reviewerMap.set(review.user.login, (reviewerMap.get(review.user.login) || 0) + 1);
          }
        });
      }
    });

    const activeReviewers = Array.from(reviewerMap.entries())
      .map(([login, reviews]) => ({ login, reviews }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 10);

    const mergedPRs = prs.filter((pr) => pr.merged_at !== null).length;
    const closedPRs = prs.filter((pr) => pr.state === "closed" && pr.merged_at === null).length;
    const openPRs = prs.filter((pr) => pr.state === "open").length;
    const totalPRs = prs.length;
    const successRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

    const analytics: PRAnalytics = {
      mergeTimeDistribution,
      averageReviewTurnaroundTime: Math.round(averageReviewTurnaroundTime * 10) / 10,
      prSizeAnalysis,
      activeReviewers,
      successRate: Math.round(successRate * 10) / 10,
      totalPRs,
      mergedPRs,
      closedPRs,
      openPRs,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch PR analytics.");
  }
}
