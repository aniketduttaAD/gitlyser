import { NextResponse } from "next/server";
import { githubJson, githubMaybeJson, githubText, GithubApiError } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import { buildRepoSummary } from "@/lib/github/summary";
import type { GithubRepo, RepoSummaryResponse } from "@/lib/github/types";

type GithubContent = {
  content: string;
  encoding: "base64";
};

type GithubTree = {
  tree: Array<{ path: string; type: "blob" | "tree" }>;
};

const EXTRA_MARKDOWN_FILES = [
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "ROADMAP.md",
  "SECURITY.md",
  "docs/README.md",
];

const decodeContent = (content: GithubContent | null) => {
  if (!content) {
    return null;
  }
  if (content.encoding !== "base64") {
    return null;
  }
  return Buffer.from(content.content, "base64").toString("utf-8");
};

/**
 * API route for fetching detailed repository summary.
 *
 * SECURITY:
 * - GitHub token handled server-side only
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
    const repoInfo = await githubJson<GithubRepo>(`/repos/${sanitizedOwner}/${sanitizedRepo}`);
    const defaultBranch = repoInfo.default_branch;

    const readmePromise = githubText(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/readme`,
      undefined,
      "application/vnd.github.raw"
    ).catch((error) => {
      if (error instanceof GithubApiError && error.status === 404) {
        return null;
      }
      throw error;
    });

    const packageJsonPromise = githubMaybeJson<GithubContent>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/package.json`
    );
    const pyprojectPromise = githubMaybeJson<GithubContent>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/pyproject.toml`
    );
    const requirementsPromise = githubMaybeJson<GithubContent>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/requirements.txt`
    );
    const languagesPromise = githubMaybeJson<Record<string, number>>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/languages`
    );
    const treePromise = githubMaybeJson<GithubTree>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/git/trees/${defaultBranch}?recursive=1`
    ).catch((error) => {
      if (error instanceof GithubApiError && error.status === 409) {
        return null;
      }
      throw error;
    });
    const extraMarkdownPromise = Promise.all(
      EXTRA_MARKDOWN_FILES.map(async (file) => {
        const content = await githubMaybeJson<GithubContent>(
          `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${file}`
        );
        return { file, content: decodeContent(content) };
      })
    );

    const [readme, packageJson, pyproject, requirements, languages, tree, additionalMarkdowns] =
      await Promise.all([
        readmePromise,
        packageJsonPromise,
        pyprojectPromise,
        requirementsPromise,
        languagesPromise,
        treePromise,
        extraMarkdownPromise,
      ]);

    const filePaths =
      tree?.tree
        ?.filter((item) => item.type === "blob")
        .map((item) => item.path)
        .slice(0, 3000) ?? [];

    const license =
      repoInfo.license?.spdx_id && repoInfo.license.spdx_id !== "NOASSERTION"
        ? repoInfo.license.spdx_id
        : (repoInfo.license?.name ?? null);
    const visibility =
      repoInfo.visibility === "private" || repoInfo.visibility === "internal"
        ? repoInfo.visibility
        : "public";

    const summary = buildRepoSummary({
      description: repoInfo.description,
      readme,
      additionalMarkdowns,
      languages,
      packageJson: decodeContent(packageJson),
      pyproject: decodeContent(pyproject),
      requirements: decodeContent(requirements),
      filePaths,
      topics: repoInfo.topics ?? [],
      defaultBranch,
      license,
      homepage: repoInfo.homepage ?? null,
      openIssues: repoInfo.open_issues_count,
      size: repoInfo.size,
      visibility,
      createdAt: repoInfo.created_at,
      pushedAt: repoInfo.pushed_at,
      cloneUrl: repoInfo.clone_url,
      sshUrl: repoInfo.ssh_url,
      gitUrl: repoInfo.git_url,
      hasIssues: repoInfo.has_issues ?? true,
      hasProjects: repoInfo.has_projects ?? false,
      hasWiki: repoInfo.has_wiki ?? false,
      hasPages: repoInfo.has_pages ?? false,
      hasDiscussions: repoInfo.has_discussions ?? false,
      allowForking: repoInfo.allow_forking ?? true,
      isTemplate: repoInfo.is_template ?? false,
      disabled: repoInfo.disabled ?? false,
      networkCount: repoInfo.network_count ?? repoInfo.forks_count,
      subscribersCount: repoInfo.subscribers_count ?? repoInfo.watchers_count,
      allowSquashMerge: repoInfo.allow_squash_merge ?? true,
      allowMergeCommit: repoInfo.allow_merge_commit ?? true,
      allowRebaseMerge: repoInfo.allow_rebase_merge ?? true,
      allowAutoMerge: repoInfo.allow_auto_merge ?? false,
      deleteBranchOnMerge: repoInfo.delete_branch_on_merge ?? false,
    });

    const response: RepoSummaryResponse = summary;

    return NextResponse.json(response);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch repo summary.");
  }
}
