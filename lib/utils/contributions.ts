import type { ContributionData, ContributionHeatmapData } from "@/lib/github/types";

/**
 * Aggregate contributions by date from events and commits
 */
export function aggregateContributionsByDate(
  events: Array<{ created_at: string; type: string }>,
  commits: Array<{ commit: { author: { date: string } } }>
): ContributionData[] {
  const contributionMap = new Map<string, number>();

  events.forEach((event) => {
    const date = new Date(event.created_at).toISOString().split("T")[0];
    const count = contributionMap.get(date) || 0;
    contributionMap.set(date, count + 1);
  });

  commits.forEach((commit) => {
    const date = new Date(commit.commit.author.date).toISOString().split("T")[0];
    const count = contributionMap.get(date) || 0;
    contributionMap.set(date, count + 1);
  });

  const contributions: ContributionData[] = Array.from(contributionMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  contributions
    .slice(0, 10)
    .map((c) => `${c.date}:${c.count}`)
    .join(", ");

  return contributions;
}

/**
 * Get contribution level (0-4) based on count
 */
export function getContributionLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;

  const ratio = count / maxCount;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

/**
 * Format contribution data for heatmap rendering
 * Returns data for a specific year or the past year (365 days)
 */
export function formatContributionData(
  contributions: ContributionData[],
  year?: number,
  startDate?: string
): ContributionHeatmapData {
  const today = new Date();
  let start: Date;
  let end: Date;

  if (year) {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
    if (end > today) {
      end = today;
    }
  } else if (startDate) {
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    start = oneYearAgo;
    end = today;
  } else {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    start = oneYearAgo;
    end = today;
  }

  const dateMap = new Map<string, number>();
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    dateMap.set(dateStr, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const startDateOnly = start.toISOString().split("T")[0];
  const endDateOnly = end.toISOString().split("T")[0];

  contributions.forEach((contribution) => {
    const dateStr = contribution.date;
    const contribDateOnly = dateStr;

    if (contribDateOnly >= startDateOnly && contribDateOnly <= endDateOnly) {
      if (dateMap.has(dateStr)) {
        const existingCount = dateMap.get(dateStr) || 0;
        dateMap.set(dateStr, existingCount + contribution.count);
      } else {
        dateMap.set(dateStr, contribution.count);
      }
    }
  });

  const formattedContributions: ContributionData[] = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalContributions = formattedContributions.reduce((sum, c) => sum + c.count, 0);
  const maxDailyContributions = Math.max(...formattedContributions.map((c) => c.count), 0);

  return {
    contributions: formattedContributions,
    totalContributions,
    maxDailyContributions,
  };
}

/**
 * Get color class for contribution level
 */
export function getContributionColorClass(level: number): string {
  switch (level) {
    case 0:
      return "bg-[#ebedf0]";
    case 1:
      return "bg-[#9be9a8]";
    case 2:
      return "bg-[#40c463]";
    case 3:
      return "bg-[#30a14e]";
    case 4:
      return "bg-[#216e39]";
    default:
      return "bg-[#ebedf0]";
  }
}
