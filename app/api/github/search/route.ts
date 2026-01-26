import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";

type GitHubSearchUser = {
  login: string;
  avatar_url: string;
  type: "User" | "Organization";
};

type GitHubSearchResponse = {
  items: GitHubSearchUser[];
  total_count: number;
};

/**
 * API route for searching GitHub users (autocomplete)
 * Note: GitHub Search API has rate limits, so we'll use a simple approach
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9-]/g, "");

  if (sanitizedQuery.length < 2 || sanitizedQuery.length > 39) {
    return NextResponse.json({ users: [] });
  }

  try {
    const response = await githubJson<GitHubSearchResponse>(
      `/search/users?q=${encodeURIComponent(sanitizedQuery)}+in:login&type:user&per_page=5`
    );

    const users = response.items.map((item) => ({
      login: item.login,
      avatar_url: item.avatar_url,
      type: item.type,
    }));

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
