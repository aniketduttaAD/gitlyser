import type { GithubRepo, RepoSummaryResponse } from "@/lib/github/types";

/**
 * Aggregate languages from all repositories
 */
export function aggregateLanguages(
  repos: GithubRepo[],
  summaries?: Record<string, RepoSummaryResponse>
): Array<{ name: string; value: number; count: number; percentage: number }> {
  const langMap = new Map<string, number>();

  repos.forEach((repo) => {
    const summary = summaries?.[repo.full_name];
    if (summary?.languages) {
      Object.entries(summary.languages).forEach(([lang, bytes]) => {
        langMap.set(lang, (langMap.get(lang) || 0) + bytes);
      });
    } else if (repo.language) {
      langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
    }
  });

  const total = Array.from(langMap.values()).reduce((sum, val) => sum + val, 0);

  return Array.from(langMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      count: value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/**
 * Get repository size distribution
 */
export function getRepoSizeDistribution(repos: GithubRepo[]) {
  const sizeRanges = [
    { label: "0-1 MB", min: 0, max: 1024 },
    { label: "1-10 MB", min: 1024, max: 10240 },
    { label: "10-50 MB", min: 10240, max: 51200 },
    { label: "50-100 MB", min: 51200, max: 102400 },
    { label: "100+ MB", min: 102400, max: Infinity },
  ];

  const distribution = sizeRanges.map((range) => ({
    name: range.label,
    count: repos.filter((repo) => repo.size >= range.min && repo.size < range.max).length,
  }));

  return distribution;
}

/**
 * Get star timeline data
 */
export function getStarTimeline(repos: GithubRepo[]) {
  const sortedRepos = [...repos]
    .filter((repo) => repo.stargazers_count > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let cumulativeStars = 0;
  return sortedRepos.map((repo) => {
    cumulativeStars += repo.stargazers_count;
    return {
      date: new Date(repo.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      stars: cumulativeStars,
      repos: sortedRepos.filter(
        (r) => new Date(r.created_at).getTime() <= new Date(repo.created_at).getTime()
      ).length,
    };
  });
}
