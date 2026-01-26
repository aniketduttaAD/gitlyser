import { NextResponse } from "next/server";
import { githubJson, githubRaw } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import type { DependencyGraph } from "@/lib/github/types";
import {
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  parseCargoToml,
  parseGoMod,
  parseGemfile,
  buildDependencyGraph,
} from "@/lib/utils/dependencyParser";

/**
 * API route for fetching repository dependencies and building a dependency graph.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo query params." }, { status: 400 });
  }

  const sanitizedOwner = owner.trim().replace(/[^a-zA-Z0-9-]/g, "");
  const sanitizedRepo = repo.trim().replace(/[^a-zA-Z0-9._-]/g, "");

  if (sanitizedOwner.length === 0 || sanitizedRepo.length === 0) {
    return NextResponse.json({ error: "Invalid owner or repo format." }, { status: 400 });
  }

  try {
    const repoInfo = await githubJson<{ default_branch: string }>(
      `/repos/${sanitizedOwner}/${sanitizedRepo}`
    );
    const defaultBranch = repoInfo.default_branch || "main";

    const dependencyFiles = [
      { path: "package.json", parser: parsePackageJson },
      { path: "requirements.txt", parser: parseRequirementsTxt },
      { path: "pyproject.toml", parser: parsePyprojectToml },
      { path: "Cargo.toml", parser: parseCargoToml },
      { path: "go.mod", parser: parseGoMod },
      { path: "Gemfile", parser: parseGemfile },
    ];

    let parsedDeps = null;

    for (const { path, parser } of dependencyFiles) {
      try {
        const content = await githubRaw(
          `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${path}?ref=${defaultBranch}`
        );
        if (content) {
          parsedDeps = parser(content);
          if (parsedDeps) {
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!parsedDeps) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        totalDependencies: 0,
        totalDevDependencies: 0,
        ecosystems: [],
      } as DependencyGraph);
    }

    const { nodes, edges } = buildDependencyGraph(parsedDeps, sanitizedRepo);

    const limitedNodes = nodes.slice(0, 100);
    const limitedEdges = edges.filter(
      (e) =>
        limitedNodes.some((n) => n.id === e.source) && limitedNodes.some((n) => n.id === e.target)
    );

    const totalDependencies = Object.keys(parsedDeps.dependencies || {}).length;
    const totalDevDependencies = Object.keys(parsedDeps.devDependencies || {}).length;
    const ecosystems = [parsedDeps.ecosystem];

    const response: DependencyGraph = {
      nodes: limitedNodes,
      edges: limitedEdges,
      totalDependencies,
      totalDevDependencies,
      ecosystems,
    };

    return NextResponse.json(response);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch dependencies.");
  }
}
