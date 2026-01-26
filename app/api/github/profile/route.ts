import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

/**
 * API route for fetching GitHub profile and repositories.
 *
 * SECURITY:
 * - Input validation prevents injection
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
    const profile = await githubJson<GithubProfile>(`/users/${sanitizedUsername}`);
    const repoPath =
      profile.type === "Organization"
        ? `/orgs/${sanitizedUsername}/repos`
        : `/users/${sanitizedUsername}/repos`;
    const repos = await githubJson<GithubRepo[]>(`${repoPath}?per_page=100&sort=updated`);

    return NextResponse.json({ profile, repos });
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch profile.");
  }
}
