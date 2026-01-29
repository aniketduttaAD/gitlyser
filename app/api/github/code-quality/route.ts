import { NextResponse } from "next/server";
import { githubJson, githubRaw } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { CodeQualityMetrics } from "@/lib/github/types";
import {
  calculatePRReviewTimes,
  calculateCodeChurn,
  analyzeDependencyHealth,
  generateRecommendations,
} from "@/lib/utils/codeQuality";

type Commit = {
  sha: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  commit: {
    author: {
      date: string;
    };
    message?: string;
  };
};

type PRReview = {
  user: { login: string } | null;
  submitted_at: string;
  state: string;
};

type PullRequest = {
  number: number;
  created_at: string;
  merged_at: string | null;
  reviews?: PRReview[];
};

/**
 * API route for fetching code quality metrics
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo query params." }, { status: 400 });
  }

  const sanitizedOwner = owner.trim().replace(/[^a-zA-Z0-9-]/g, "");
  const sanitizedRepo = repo.trim().replace(/[^a-zA-Z0-9._-]/g, "");

  if (sanitizedOwner.length === 0 || sanitizedRepo.length === 0) {
    return NextResponse.json({ error: "Invalid owner or repo format." }, { status: 400 });
  }

  try {
    const repoInfo = await githubJson<{ default_branch: string }>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}`
    );
    const defaultBranch = repoInfo.default_branch || "main";

    const prs = await githubJson<PullRequest[]>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/pulls?state=all&per_page=100&sort=updated`
    ).catch(() => []);

    const prDetailsPromises = prs.slice(0, 50).map((pr) =>
      githubJson<PRReview[]>(`/repos/${sanitizedOwner}/${sanitizedRepo}/pulls/${pr.number}/reviews`)
        .then((reviews) => ({ ...pr, reviews }))
        .catch(() => pr)
    );

    const prsWithReviews = await Promise.all(prDetailsPromises);

    const { average, median } = calculatePRReviewTimes(prsWithReviews);

    const commits = await githubJson<Commit[]>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/commits?per_page=100&sha=${defaultBranch}`
    ).catch(() => []);

    const commitsWithStatsPromises = commits
      .slice(0, 100)
      .map((commit) =>
        githubJson<Commit>(`/repos/${sanitizedOwner}/${sanitizedRepo}/commits/${commit.sha}`).catch(
          () => commit
        )
      );

    const commitsWithStats = await Promise.all(commitsWithStatsPromises);

    const { churnData, averageChurnPerCommit } = calculateCodeChurn(commitsWithStats);

    const dependencyFiles = [
      { path: "package.json", ecosystem: "package.json" },
      { path: "requirements.txt", ecosystem: "requirements.txt" },
      { path: "pyproject.toml", ecosystem: "pyproject.toml" },
      { path: "Cargo.toml", ecosystem: "Cargo.toml" },
      { path: "go.mod", ecosystem: "go.mod" },
      { path: "Gemfile", ecosystem: "Gemfile" },
    ];

    let dependencyHealth = {
      total: 0,
      outdated: 0,
      vulnerable: 0,
      latest: 0,
      ecosystems: {},
    };

    for (const { path, ecosystem } of dependencyFiles) {
      try {
        const content = await githubRaw(
          `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${path}?ref=${defaultBranch}`
        );
        if (content) {
          dependencyHealth = analyzeDependencyHealth(content, ecosystem);
          break;
        }
      } catch {
        continue;
      }
    }

    const recommendations = generateRecommendations({
      averagePRReviewTime: average,
      dependencyHealth,
      averageChurnPerCommit,
    });

    const response: CodeQualityMetrics = {
      averagePRReviewTime: Math.round(average * 10) / 10,
      medianPRReviewTime: Math.round(median * 10) / 10,
      codeChurn: churnData,
      averageChurnPerCommit,
      dependencyHealth,
      recommendations,
      lastCalculated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch code quality metrics.");
  }
}
