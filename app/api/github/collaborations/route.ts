import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { CollaborationNetwork, GithubRepo } from "@/lib/github/types";
import { buildCollaborationNetwork } from "@/lib/utils/collaborations";

type Contributor = {
  login: string;
  avatar_url: string;
  contributions: number;
};

type PRReview = {
  user: { login: string } | null;
  state: string;
  submitted_at?: string;
};

type PullRequest = {
  user: { login: string } | null;
  number: number;
};

type PRDetail = PullRequest & {
  reviews: PRReview[];
};

/**
 * API route for fetching collaboration network data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing username query param." }, { status: 400 });
  }

  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
  }

  try {
    const profile = await githubJson<{ type: string }>(`/users/${sanitizedUsername}`);
    const repoPath =
      profile.type === "Organization"
        ? `/orgs/${sanitizedUsername}/repos`
        : `/users/${sanitizedUsername}/repos`;
    const repos = await githubJson<GithubRepo[]>(`${repoPath}?per_page=100&sort=updated`);

    if (repos.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        totalCollaborators: 0,
        totalRepos: 0,
        mostActiveCollaborator: null,
      } as CollaborationNetwork);
    }

    const reposToAnalyze = repos.slice(0, 20);
    const allContributors: Contributor[] = [];
    const allPRs: PRDetail[] = [];
    const repoNames: string[] = [];

    for (const repo of reposToAnalyze) {
      try {
        repoNames.push(repo.full_name);
        const repoOwner = repo.full_name.split("/")[0] || sanitizedUsername;

        const contributors = await githubJson<Contributor[]>(
          `/repos/${repoOwner}/${repo.name}/contributors?per_page=30`
        ).catch(() => []);

        allContributors.push(...contributors);

        const prs = await githubJson<PullRequest[]>(
          `/repos/${repoOwner}/${repo.name}/pulls?state=all&per_page=30&sort=updated`
        ).catch(() => []);

        const prDetailsPromises = prs.slice(0, 10).map((pr) =>
          githubJson<PRDetail>(`/repos/${repoOwner}/${repo.name}/pulls/${pr.number}`)
            .then((prDetail) => ({
              ...prDetail,
              reviews: prDetail.reviews || [],
            }))
            .catch(() => null)
        );

        const prDetailsResults = await Promise.all(prDetailsPromises);
        const prDetails = prDetailsResults.filter((pr): pr is PRDetail => pr !== null);

        allPRs.push(...prDetails);
      } catch (error) {
        console.error(`Failed to fetch data for ${repo.full_name}:`, error);
        continue;
      }
    }

    const network = buildCollaborationNetwork(allContributors, allPRs, repoNames);

    return NextResponse.json(network);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch collaborations.");
  }
}
