import type { GithubRepo, RepoHealthScore, HealthScoreBreakdown } from "@/lib/github/types";

type HealthScoreInput = {
  repo: GithubRepo;
  readmeLength?: number;
  hasContributing?: boolean;
  hasChangelog?: boolean;
  hasLicense?: boolean;
  hasCodeOfConduct?: boolean;
  recentCommits?: number;
  commitFrequency?: number;
  issueResponseTime?: number;
  issueResolutionRate?: number;
  hasCI?: boolean;
};

/**
 * Calculate repository health score (0-100)
 */
export function calculateHealthScore(input: HealthScoreInput): RepoHealthScore {
  const breakdown: HealthScoreBreakdown = {
    documentation: calculateDocumentationScore(input),
    maintenance: calculateMaintenanceScore(input),
    community: calculateCommunityScore(input),
    issueResponse: calculateIssueResponseScore(input),
    codeQuality: calculateCodeQualityScore(input),
  };

  const overall =
    breakdown.documentation +
    breakdown.maintenance +
    breakdown.community +
    breakdown.issueResponse +
    breakdown.codeQuality;

  const recommendations = generateRecommendations(breakdown, input);

  return {
    overall: Math.round(overall),
    breakdown,
    recommendations,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Documentation quality score (0-30 points)
 */
function calculateDocumentationScore(input: HealthScoreInput): number {
  let score = 0;

  if (input.readmeLength) {
    if (input.readmeLength > 2000) score += 15;
    else if (input.readmeLength > 1000) score += 12;
    else if (input.readmeLength > 500) score += 8;
    else if (input.readmeLength > 100) score += 5;
  }

  if (input.hasContributing) score += 5;
  if (input.hasChangelog) score += 5;
  if (input.hasCodeOfConduct) score += 5;

  return Math.min(score, 30);
}

/**
 * Active maintenance score (0-25 points)
 */
function calculateMaintenanceScore(input: HealthScoreInput): number {
  let score = 0;

  if (input.recentCommits !== undefined) {
    if (input.recentCommits > 20) score += 15;
    else if (input.recentCommits > 10) score += 12;
    else if (input.recentCommits > 5) score += 8;
    else if (input.recentCommits > 0) score += 5;
  }

  if (input.commitFrequency !== undefined) {
    if (input.commitFrequency > 50) score += 10;
    else if (input.commitFrequency > 20) score += 8;
    else if (input.commitFrequency > 10) score += 5;
    else if (input.commitFrequency > 0) score += 2;
  }

  return Math.min(score, 25);
}

/**
 * Community engagement score (0-20 points)
 */
function calculateCommunityScore(input: HealthScoreInput): number {
  let score = 0;
  const repo = input.repo;

  if (repo.stargazers_count > 1000) score += 8;
  else if (repo.stargazers_count > 500) score += 6;
  else if (repo.stargazers_count > 100) score += 4;
  else if (repo.stargazers_count > 10) score += 2;

  if (repo.forks_count > 100) score += 6;
  else if (repo.forks_count > 50) score += 4;
  else if (repo.forks_count > 10) score += 2;

  if (repo.open_issues_count > 0) {
    score += Math.min(6, repo.open_issues_count / 10);
  }

  return Math.min(score, 20);
}

/**
 * Issue response time score (0-15 points)
 */
function calculateIssueResponseScore(input: HealthScoreInput): number {
  let score = 0;

  if (input.issueResponseTime !== undefined) {
    if (input.issueResponseTime < 24) score += 15;
    else if (input.issueResponseTime < 72) score += 12;
    else if (input.issueResponseTime < 168) score += 8;
    else if (input.issueResponseTime < 720) score += 4;
  }

  if (input.issueResolutionRate !== undefined) {
    const bonus = Math.floor((input.issueResolutionRate / 100) * 5);
    score += bonus;
  }

  return Math.min(score, 15);
}

/**
 * Code quality indicators score
 */
function calculateCodeQualityScore(input: HealthScoreInput): number {
  let score = 0;

  if (input.hasLicense) score += 3;
  if (input.hasCI) score += 4;
  if (input.repo.has_wiki) score += 1;
  if (input.repo.has_pages) score += 1;
  if (input.repo.allow_forking) score += 1;

  return Math.min(score, 10);
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(
  breakdown: HealthScoreBreakdown,
  input: HealthScoreInput
): string[] {
  const recommendations: string[] = [];

  if (breakdown.documentation < 20) {
    if (!input.readmeLength || input.readmeLength < 500) {
      recommendations.push("Add a comprehensive README with installation and usage instructions");
    }
    if (!input.hasContributing) {
      recommendations.push("Add a CONTRIBUTING.md file to guide contributors");
    }
    if (!input.hasLicense) {
      recommendations.push("Add a LICENSE file to clarify usage rights");
    }
  }

  if (breakdown.maintenance < 15) {
    recommendations.push("Increase commit frequency to show active maintenance");
  }

  if (breakdown.community < 12) {
    recommendations.push("Engage with the community through issues and discussions");
  }

  if (breakdown.issueResponse < 10) {
    recommendations.push("Respond to issues more quickly to improve community engagement");
  }

  if (breakdown.codeQuality < 6) {
    if (!input.hasCI) {
      recommendations.push("Set up CI/CD to ensure code quality");
    }
    if (!input.hasLicense) {
      recommendations.push("Add a LICENSE file");
    }
  }

  return recommendations;
}
