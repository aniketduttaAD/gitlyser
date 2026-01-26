import { NextResponse } from "next/server";
import { githubJson, githubMaybeJson, GithubApiError } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { GithubRepo } from "@/lib/github/types";

type GithubTree = {
  tree: Array<{ path: string; type: "blob" | "tree" }>;
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
    const repoInfo = await githubJson<GithubRepo>(`/repos/${sanitizedOwner}/${sanitizedRepo}`);
    const defaultBranch = repoInfo.default_branch;

    const tree = await githubMaybeJson<GithubTree>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/git/trees/${defaultBranch}?recursive=1`
    ).catch((error) => {
      if (error instanceof GithubApiError && error.status === 409) {
        return null;
      }
      throw error;
    });

    const filePaths =
      tree?.tree?.filter((item) => item.type === "blob").map((item) => item.path) ?? [];

    return NextResponse.json({ paths: filePaths });
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch file tree.");
  }
}
