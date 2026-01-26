import { NextResponse } from "next/server";
import { githubText, githubMaybeJson, GithubApiError } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";

type GithubContent = {
  content: string;
  encoding: "base64";
};

const decodeContent = (content: GithubContent | null): string | null => {
  if (!content) return null;
  if (content.encoding !== "base64") return null;
  return Buffer.from(content.content, "base64").toString("utf-8");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const file = searchParams.get("file");

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
    if (file && typeof file === "string") {
      const sanitizedFile = file.trim().replace(/\.\./g, "").replace(/^\//, "");

      const fileContent = await githubMaybeJson<GithubContent>(
        `/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${sanitizedFile}`
      );

      const decoded = decodeContent(fileContent);
      if (decoded) {
        return NextResponse.json({ content: decoded });
      }
      return NextResponse.json({ content: null });
    }

    const readme = await githubText(
      `/repos/${sanitizedOwner}/${sanitizedRepo}/readme`,
      undefined,
      "application/vnd.github.raw"
    ).catch((error) => {
      if (error instanceof GithubApiError && error.status === 404) {
        return null;
      }
      throw error;
    });

    return NextResponse.json({ content: readme });
  } catch (error) {
    return apiErrorResponse(error, `Failed to fetch ${file || "README"}.`);
  }
}
