import { NextResponse } from "next/server";
import { githubJson, githubMaybeJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import { calculateHealthScore } from "@/lib/utils/healthScore";
import type { GithubRepo } from "@/lib/github/types";

/**
 * API route for calculating repository health score.
 *
 * SECURITY:
 * - Input validation prevents injection
 * - Graceful error handling
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
    const repoData = await githubJson<GithubRepo>(`/repos/${sanitizedOwner}/${sanitizedRepo}`);

    const readme = await githubMaybeJson<{ content: string }>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/readme`
    );

    const [contributing, changelog, codeOfConduct] = await Promise.all([
      githubMaybeJson(`/repos/${sanitizedOwner}/${sanitizedRepo}/contents/CONTRIBUTING.md`),
      githubMaybeJson(`/repos/${sanitizedOwner}/${sanitizedRepo}/contents/CHANGELOG.md`),
      githubMaybeJson(`/repos/${sanitizedOwner}/${sanitizedRepo}/contents/CODE_OF_CONDUCT.md`),
    ]);

    const commits = await githubMaybeJson<Array<{ commit: { author: { date: string } } }>>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/commits?per_page=30&since=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`
    );

    const issues = await githubMaybeJson<
      Array<{
        created_at: string;
        closed_at: string | null;
        timeline_url: string;
      }>
    >(`/repos/${sanitizedOwner}/${sanitizedRepo}/issues?state=all&per_page=30`);

    const readmeLength = readme?.content
      ? Buffer.from(readme.content, "base64").toString().length
      : 0;

    const recentCommits = commits?.length || 0;
    const commitFrequency = recentCommits;

    let issueResponseTime: number | undefined;
    if (issues && issues.length > 0) {
      const responseTimes: number[] = [];
      issues.forEach((issue) => {
        if (issue.closed_at) {
          const created = new Date(issue.created_at).getTime();
          const closed = new Date(issue.closed_at).getTime();
          const hours = (closed - created) / (1000 * 60 * 60);
          responseTimes.push(hours);
        }
      });
      if (responseTimes.length > 0) {
        issueResponseTime =
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      }
    }

    const issueResolutionRate =
      issues && issues.length > 0
        ? (issues.filter((i) => i.closed_at).length / issues.length) * 100
        : undefined;

    const [hasCI] = await Promise.all([
      githubMaybeJson(`/repos/${sanitizedOwner}/${sanitizedRepo}/contents/.github/workflows`),
    ]);

    const healthScore = calculateHealthScore({
      repo: repoData,
      readmeLength,
      hasContributing: !!contributing,
      hasChangelog: !!changelog,
      hasLicense: !!repoData.license,
      hasCodeOfConduct: !!codeOfConduct,
      recentCommits,
      commitFrequency,
      issueResponseTime,
      issueResolutionRate,
      hasCI: !!hasCI,
    });

    return NextResponse.json(healthScore);
  } catch (error) {
    return apiErrorResponse(error, "Failed to calculate repository health score.");
  }
}
