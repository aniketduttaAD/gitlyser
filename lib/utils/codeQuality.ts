import type { CodeQualityMetrics, CodeChurnData, DependencyHealth } from "@/lib/github/types";
import {
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  parseCargoToml,
  parseGoMod,
  parseGemfile,
} from "./dependencyParser";

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
 * Calculate PR review times
 * Improved: Considers first review of any type (not just APPROVED) for more accurate metrics
 */
export function calculatePRReviewTimes(prs: PullRequest[]): {
  average: number;
  median: number;
} {
  const reviewTimes: number[] = [];
  const approvedReviewTimes: number[] = [];

  for (const pr of prs) {
    if (!pr.reviews || pr.reviews.length === 0) continue;

    const sortedReviews = pr.reviews
      .filter((r) => r.submitted_at)
      .sort((a, b) => new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime());

    if (sortedReviews.length === 0) continue;

    const firstReview = sortedReviews[0];
    if (firstReview.submitted_at) {
      const hours =
        (new Date(firstReview.submitted_at).getTime() - new Date(pr.created_at).getTime()) /
        (1000 * 60 * 60);
      if (hours > 0 && hours < 720) {
        reviewTimes.push(hours);
      }
    }

    const firstApproved = sortedReviews.find((r) => r.state === "APPROVED");
    if (firstApproved && firstApproved.submitted_at) {
      const hours =
        (new Date(firstApproved.submitted_at).getTime() - new Date(pr.created_at).getTime()) /
        (1000 * 60 * 60);
      if (hours > 0 && hours < 720) {
        approvedReviewTimes.push(hours);
      }
    }
  }

  const timesToUse = approvedReviewTimes.length > 0 ? approvedReviewTimes : reviewTimes;

  if (timesToUse.length === 0) {
    return { average: 0, median: 0 };
  }

  const sorted = [...timesToUse].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const filteredTimes = sorted.filter((t) => t >= lowerBound && t <= upperBound);

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const average =
    filteredTimes.length > 0
      ? filteredTimes.reduce((sum, time) => sum + time, 0) / filteredTimes.length
      : sorted.reduce((sum, time) => sum + time, 0) / sorted.length;

  return { average, median };
}

/**
 * Calculate code churn from commits
 * Improved: Filters out merge commits and very small changes for more accurate metrics
 */
export function calculateCodeChurn(commits: Commit[]): {
  churnData: CodeChurnData[];
  averageChurnPerCommit: number;
} {
  const churnByDate = new Map<string, { additions: number; deletions: number; commits: number }>();

  const meaningfulCommits = commits.filter((commit) => {
    if (!commit.stats) return false;

    const message = commit.commit?.message?.toLowerCase() || "";
    const isMergeCommit =
      message.startsWith("merge") ||
      (commit.stats.deletions > commit.stats.additions * 2 && commit.stats.total > 100);

    const isMeaningfulChange = commit.stats.total >= 5;

    return !isMergeCommit && isMeaningfulChange;
  });

  for (const commit of meaningfulCommits) {
    if (!commit.stats) continue;

    const date = new Date(commit.commit.author.date).toISOString().split("T")[0];
    const existing = churnByDate.get(date) || { additions: 0, deletions: 0, commits: 0 };

    churnByDate.set(date, {
      additions: existing.additions + (commit.stats.additions || 0),
      deletions: existing.deletions + (commit.stats.deletions || 0),
      commits: existing.commits + 1,
    });
  }

  const churnData: CodeChurnData[] = Array.from(churnByDate.entries())
    .map(([date, data]) => ({
      date,
      additions: data.additions,
      deletions: data.deletions,
      netChange: data.additions - data.deletions,
      commits: data.commits,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  const totalChurn = meaningfulCommits.reduce((sum, c) => sum + (c.stats?.total || 0), 0);
  const averageChurnPerCommit =
    meaningfulCommits.length > 0 ? totalChurn / meaningfulCommits.length : 0;

  return { churnData, averageChurnPerCommit: Math.round(averageChurnPerCommit) };
}

/**
 * Analyze dependency health
 */
export function analyzeDependencyHealth(
  dependencyContent: string | null,
  ecosystem: string
): DependencyHealth {
  if (!dependencyContent) {
    return {
      total: 0,
      outdated: 0,
      vulnerable: 0,
      latest: 0,
      ecosystems: {},
    };
  }

  let parsed = null;
  switch (ecosystem) {
    case "package.json":
      parsed = parsePackageJson(dependencyContent);
      break;
    case "requirements.txt":
      parsed = parseRequirementsTxt(dependencyContent);
      break;
    case "pyproject.toml":
      parsed = parsePyprojectToml(dependencyContent);
      break;
    case "Cargo.toml":
      parsed = parseCargoToml(dependencyContent);
      break;
    case "go.mod":
      parsed = parseGoMod(dependencyContent);
      break;
    case "Gemfile":
      parsed = parseGemfile(dependencyContent);
      break;
  }

  if (!parsed) {
    return {
      total: 0,
      outdated: 0,
      vulnerable: 0,
      latest: 0,
      ecosystems: {},
    };
  }

  const total =
    Object.keys(parsed.dependencies || {}).length +
    Object.keys(parsed.devDependencies || {}).length;

  const allDeps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };

  const outdated = Object.values(allDeps).filter((v) => {
    if (!v || v === "unknown") return true;

    const versionStr = String(v).trim();

    const exactVersionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    if (exactVersionPattern.test(versionStr)) return false;

    if (/[~^><=*x]/.test(versionStr)) return true;

    return versionStr.length === 0;
  }).length;

  return {
    total,
    outdated,
    vulnerable: 0,
    latest: total - outdated,
    ecosystems: {
      [parsed.ecosystem]: {
        total,
        outdated,
      },
    },
  };
}

/**
 * Generate code quality recommendations
 */
export function generateRecommendations(metrics: Partial<CodeQualityMetrics>): string[] {
  const recommendations: string[] = [];

  if (metrics.averagePRReviewTime) {
    if (metrics.averagePRReviewTime > 72) {
      recommendations.push(
        `PR review time is very high (${metrics.averagePRReviewTime.toFixed(1)}h). Consider setting review SLAs or automating review assignments.`
      );
    } else if (metrics.averagePRReviewTime > 48) {
      recommendations.push(
        `Consider improving PR review turnaround time (currently ${metrics.averagePRReviewTime.toFixed(1)} hours). Aim for < 24 hours.`
      );
    } else if (metrics.averagePRReviewTime > 24) {
      recommendations.push(
        `PR review time is good but could be improved (currently ${metrics.averagePRReviewTime.toFixed(1)} hours).`
      );
    }
  }

  if (metrics.dependencyHealth) {
    const outdatedPercentage =
      metrics.dependencyHealth.total > 0
        ? (metrics.dependencyHealth.outdated / metrics.dependencyHealth.total) * 100
        : 0;

    if (metrics.dependencyHealth.total === 0) {
      recommendations.push("Consider adding dependency management for better project organization");
    } else if (outdatedPercentage > 50) {
      recommendations.push(
        `High percentage of outdated dependencies (${outdatedPercentage.toFixed(0)}%). Prioritize security updates.`
      );
    } else if (outdatedPercentage > 30) {
      recommendations.push(
        `Update outdated dependencies (${metrics.dependencyHealth.outdated}/${metrics.dependencyHealth.total}) to improve security and compatibility`
      );
    } else if (outdatedPercentage > 10) {
      recommendations.push(
        `Some dependencies may need updates (${metrics.dependencyHealth.outdated}/${metrics.dependencyHealth.total} outdated)`
      );
    }
  }

  if (metrics.averageChurnPerCommit) {
    if (metrics.averageChurnPerCommit > 1000) {
      recommendations.push(
        `Very large commits detected (avg ${metrics.averageChurnPerCommit} lines). Consider breaking changes into smaller, focused commits for better code review.`
      );
    } else if (metrics.averageChurnPerCommit > 500) {
      recommendations.push(
        `Large commits detected (avg ${metrics.averageChurnPerCommit} lines). Consider breaking down into smaller, focused changes.`
      );
    } else if (metrics.averageChurnPerCommit < 10) {
      recommendations.push(
        `Very small commits (avg ${metrics.averageChurnPerCommit} lines). Consider batching related changes together.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Code quality metrics look good! Keep up the great work.");
  }

  return recommendations;
}
