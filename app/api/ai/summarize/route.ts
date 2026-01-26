import { NextResponse } from "next/server";

type SummarizeRequest = {
  openaiKey: string;
  repoData: {
    name: string;
    description: string | null;
    readme: string | null;
    additionalMarkdowns: Array<{ file: string; content: string | null }>;
    languages: Record<string, number>;
    topics: string[];
    techStack: string[];
    filePaths: string[];
    defaultBranch: string;
    license: string | null;
    homepage: string | null;
    openIssues: number;
    size: number;
    visibility: string;
    createdAt: string;
    pushedAt: string;
    cloneUrl: string;
    sshUrl?: string;
    gitUrl?: string;
    hasIssues: boolean;
    hasProjects: boolean;
    hasWiki: boolean;
    hasPages: boolean;
    hasDiscussions: boolean;
    allowForking: boolean;
    isTemplate: boolean;
    disabled: boolean;
    networkCount: number;
    subscribersCount: number;
    allowSquashMerge: boolean;
    allowMergeCommit: boolean;
    allowRebaseMerge: boolean;
    allowAutoMerge: boolean;
    deleteBranchOnMerge: boolean;
  };
};

const OPENAI_MODEL = "gpt-4o-mini";

function stripReadmeIntelligently(readme: string): string {
  let content = readme;

  content = content.replace(/<!--[\s\S]*?-->/g, "");

  content = content.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "");
  content = content.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  content = content.replace(/\[!\[[^\]]*\]\([^)]*\)\]/g, "");

  content = content.replace(
    /\[\!\[(?:Build|Coverage|License|Version|Downloads|npm|CI|CD|Status|Badge)[^\]]*\]\([^)]*\)\]\([^)]*\)/gi,
    ""
  );

  content = content.replace(/<img[^>]*>/gi, "");
  content = content.replace(/<picture[\s\S]*?<\/picture>/gi, "");
  content = content.replace(/<video[\s\S]*?<\/video>/gi, "");
  content = content.replace(/<source[^>]*>/gi, "");
  content = content.replace(/<br\s*\/?>/gi, "\n");
  content = content.replace(/<hr\s*\/?>/gi, "\n");
  content = content.replace(/<\/?(?:div|span|p|center|align)[^>]*>/gi, "");

  content = content.replace(
    /^#{1,6}\s*(?:Table of Contents|TOC|Contents|Index)\s*$[\s\S]*?(?=^#{1,6}\s|\z)/gim,
    ""
  );
  content = content.replace(/^\s*[-*]\s*\[[^\]]*\]\(#[^)]*\)\s*$/gm, "");

  content = content.replace(
    /^#{1,6}\s*(?:Contributors?|Acknowledgements?|Thanks|Credits|Sponsors?|Backers?)\s*$[\s\S]*?(?=^#{1,6}\s|\z)/gim,
    ""
  );

  content = content.replace(
    /^#{1,6}\s*(?:Star History|Stargazers)\s*$[\s\S]*?(?=^#{1,6}\s|\z)/gim,
    ""
  );

  content = content.replace(/```[\s\S]*?```/g, (match) => {
    const lines = match.split("\n");
    if (lines.length > 15) {
      return lines.slice(0, 8).join("\n") + "\n...\n```";
    }
    return match;
  });

  content = content.replace(/\n{3,}/g, "\n\n");
  content = content.replace(/^\s+|\s+$/g, "");

  content = content.replace(/^[-*_]{3,}\s*$/gm, "");

  const lines = content.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (/^<a\s+href=/.test(trimmed) && /badge|shield|img\.shields\.io/.test(trimmed)) return false;
    if (/img\.shields\.io|badgen\.net|badge\.fury\.io|travis-ci|circleci|codecov/.test(trimmed))
      return false;
    if (/^\[!\[/.test(trimmed) && trimmed.length < 200) return false;
    return true;
  });

  content = filteredLines.join("\n");

  const maxLength = 6000;
  if (content.length > maxLength) {
    const sections = content.split(/(?=^#{1,3}\s)/m);
    let result = "";
    const prioritySections = [
      "install",
      "usage",
      "getting started",
      "quick start",
      "features",
      "overview",
      "about",
    ];

    const sortedSections = sections.sort((a, b) => {
      const aHeader = a.split("\n")[0].toLowerCase();
      const bHeader = b.split("\n")[0].toLowerCase();
      const aIndex = prioritySections.findIndex((p) => aHeader.includes(p));
      const bIndex = prioritySections.findIndex((p) => bHeader.includes(p));
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    for (const section of sortedSections) {
      if (result.length + section.length < maxLength) {
        result += section;
      } else if (result.length < maxLength * 0.7) {
        const remaining = maxLength - result.length - 50;
        if (remaining > 200) {
          result += section.slice(0, remaining) + "\n[truncated]";
        }
        break;
      }
    }

    content = result || content.slice(0, maxLength);
  }

  return content.trim();
}

function extractFileStructureInsights(filePaths: string[]): string {
  const insights: string[] = [];

  const dirs = new Set<string>();
  const extensions = new Map<string, number>();

  for (const path of filePaths) {
    const parts = path.split("/");
    if (parts.length > 1) dirs.add(parts[0]);

    const ext = path.split(".").pop()?.toLowerCase();
    if (ext && ext.length < 10) {
      extensions.set(ext, (extensions.get(ext) || 0) + 1);
    }
  }

  const topDirs = Array.from(dirs).slice(0, 10);
  if (topDirs.length > 0) {
    insights.push(`Directories: ${topDirs.join(", ")}`);
  }

  const topExtensions = Array.from(extensions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ext, count]) => `${ext}(${count})`)
    .join(", ");

  if (topExtensions) {
    insights.push(`File types: ${topExtensions}`);
  }

  const hasTests = filePaths.some((p) => /test|spec|__tests__/i.test(p));
  const hasDocs = filePaths.some((p) => /docs?\/|documentation/i.test(p));
  const hasCI = filePaths.some((p) =>
    /\.github\/workflows|\.gitlab-ci|jenkinsfile|\.circleci/i.test(p)
  );
  const hasDocker = filePaths.some((p) => /dockerfile|docker-compose/i.test(p));
  const hasConfig = filePaths.some((p) => /\.env|config\.|settings\./i.test(p));

  const features = [
    hasTests ? "tests" : null,
    hasDocs ? "docs" : null,
    hasCI ? "CI/CD" : null,
    hasDocker ? "Docker" : null,
    hasConfig ? "config" : null,
  ].filter(Boolean);

  if (features.length > 0) {
    insights.push(`Has: ${features.join(", ")}`);
  }

  return insights.join(" | ");
}

function buildMetadata(repoData: SummarizeRequest["repoData"]): string {
  const lines: string[] = [];

  lines.push(`Name: ${repoData.name}`);

  if (repoData.description) {
    lines.push(`Description: ${repoData.description}`);
  }

  const languages = Object.entries(repoData.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([lang, bytes]) => {
      const kb = bytes / 1024;
      return kb > 100 ? `${lang}(${(kb / 1024).toFixed(1)}MB)` : `${lang}(${kb.toFixed(0)}KB)`;
    })
    .join(", ");

  if (languages) lines.push(`Languages: ${languages}`);

  if (repoData.techStack.length > 0) {
    lines.push(`Tech Stack: ${repoData.techStack.slice(0, 8).join(", ")}`);
  }

  if (repoData.topics.length > 0) {
    lines.push(`Topics: ${repoData.topics.slice(0, 6).join(", ")}`);
  }

  if (repoData.license) lines.push(`License: ${repoData.license}`);
  if (repoData.homepage) lines.push(`Homepage: ${repoData.homepage}`);

  const stats = [
    `${repoData.openIssues} open issues`,
    `${repoData.networkCount} forks`,
    `${repoData.subscribersCount} watchers`,
    `${(repoData.size / 1024).toFixed(1)}MB`,
  ].join(", ");
  lines.push(`Stats: ${stats}`);

  const features = [
    repoData.isTemplate ? "Template repo" : null,
    repoData.hasPages ? "GitHub Pages" : null,
    repoData.hasWiki ? "Wiki" : null,
    repoData.hasDiscussions ? "Discussions" : null,
  ].filter(Boolean);

  if (features.length > 0) {
    lines.push(`Features: ${features.join(", ")}`);
  }

  if (repoData.filePaths.length > 0) {
    const structureInsights = extractFileStructureInsights(repoData.filePaths);
    if (structureInsights) lines.push(`Structure: ${structureInsights}`);
  }

  return lines.join("\n");
}

async function callOpenAI(
  openaiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string | null; error: string | null; status: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error?.message || `API error: ${response.statusText}`;

    errorMessage = errorMessage
      .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]");

    if (response.status === 401) {
      errorMessage = "Invalid OpenAI API key. Please check your key in settings.";
    } else if (response.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (response.status >= 500) {
      errorMessage = "OpenAI API is temporarily unavailable. Please try again.";
    }

    return { content: null, error: errorMessage, status: response.status };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || null;
  const finishReason = data.choices?.[0]?.finish_reason;

  if (finishReason === "length" && content) {
    return { content: content + "\n\n[Summary truncated]", error: null, status: 200 };
  }

  return { content, error: null, status: 200 };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SummarizeRequest;

    if (!body.openaiKey || typeof body.openaiKey !== "string") {
      return NextResponse.json({ error: "OpenAI API key is required." }, { status: 400 });
    }

    if (!body.repoData || typeof body.repoData !== "object") {
      return NextResponse.json({ error: "Repository data is required." }, { status: 400 });
    }

    const { repoData, openaiKey } = body;
    const trimmedKey = openaiKey.trim();

    if (!trimmedKey.startsWith("sk-") || trimmedKey.length < 20) {
      return NextResponse.json({ error: "Invalid OpenAI API key format." }, { status: 400 });
    }

    if (
      typeof repoData.name !== "string" ||
      repoData.name.length > 200 ||
      (repoData.description !== null && typeof repoData.description !== "string") ||
      (repoData.readme !== null && typeof repoData.readme !== "string")
    ) {
      return NextResponse.json({ error: "Invalid repository data format." }, { status: 400 });
    }

    const metadata = buildMetadata(repoData);

    let readmeContent = "";
    if (repoData.readme && repoData.readme.trim().length > 50) {
      readmeContent = stripReadmeIntelligently(repoData.readme);
    }

    const additionalDocs: string[] = [];
    const importantDocs = repoData.additionalMarkdowns
      .filter((md) => md.content && md.content.trim().length > 100)
      .sort((a, b) => {
        const priority = ["contributing", "changelog", "api", "guide", "tutorial"];
        const aScore = priority.findIndex((p) => a.file.toLowerCase().includes(p));
        const bScore = priority.findIndex((p) => b.file.toLowerCase().includes(p));
        return aScore - bScore;
      })
      .slice(0, 2);

    for (const doc of importantDocs) {
      if (doc.content) {
        const stripped = doc.content.trim().slice(0, 1500);
        additionalDocs.push(`[${doc.file}]\n${stripped}`);
      }
    }

    const systemPrompt = `You are a senior technical writer creating repository summaries for developers. Write clear, informative summaries that help developers quickly understand what a project does and whether it's relevant to them. Be accurate and only use provided information.`;

    const userPrompt = `Create a comprehensive technical summary for this GitHub repository.

REPOSITORY METADATA:
${metadata}

${readmeContent ? `README CONTENT:\n${readmeContent}` : "No README available."}

${additionalDocs.length > 0 ? `ADDITIONAL DOCUMENTATION:\n${additionalDocs.join("\n\n")}` : ""}

Write a 3-4 paragraph summary (200-280 words) covering:
1. What the project is and its primary purpose
2. Key features and capabilities  
3. Technical implementation (languages, frameworks, architecture)
4. Target audience and use cases

Use professional tone. Be specific about features mentioned in the documentation. Do not invent or assume features not explicitly stated.`;

    const result = await callOpenAI(trimmedKey, systemPrompt, userPrompt, 800);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (!result.content || result.content.length < 50) {
      return NextResponse.json(
        { error: "Failed to generate summary. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: result.content });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate summary.";
    const sanitized = errorMessage
      .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]");

    return NextResponse.json({ error: sanitized }, { status: 500 });
  }
}
