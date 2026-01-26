import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { PullRequestGroup, PullRequestItem } from "@/lib/github/types";

const groupPullRequests = (items: PullRequestItem[]): PullRequestGroup[] => {
  const groups = new Map<string, PullRequestItem[]>();

  items.forEach((item) => {
    const base = item.base?.ref ?? "unknown";
    const bucket = groups.get(base) ?? [];
    bucket.push(item);
    groups.set(base, bucket);
  });

  return Array.from(groups.entries())
    .map(([base, prs]) => ({
      base,
      count: prs.length,
      recent: prs
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count);
};

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
    const grouped = groupPullRequests(prs);
    const response = { groups: grouped };

    return NextResponse.json(response);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch pull requests.");
  }
}
