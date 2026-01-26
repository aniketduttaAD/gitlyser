import type { RepoSummaryResponse } from "./types";

type RepoSummaryInput = {
  description: string | null;
  readme: string | null;
  additionalMarkdowns: Array<{ file: string; content: string | null }>;
  languages: Record<string, number> | null;
  packageJson: string | null;
  pyproject: string | null;
  requirements: string | null;
  filePaths: string[];
  topics: string[];
  defaultBranch: string;
  license: string | null;
  homepage: string | null;
  openIssues: number;
  size: number;
  visibility: "public" | "private" | "internal";
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

const unique = (items: string[]) => {
  const seen = new Set<string>();
  const results: string[] = [];
  items.forEach((item) => {
    const normalized = item.toLowerCase().trim();
    if (!seen.has(normalized) && item.trim()) {
      seen.add(normalized);
      results.push(item);
    }
  });
  return results;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 3);

const isTooSimilar = (a: string, b: string) => {
  if (!a || !b) {
    return false;
  }
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.size || !tokensB.size) {
    return false;
  }
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  });
  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union >= 0.55;
};

const BOILERPLATE_PATTERNS = [
  /getting started with create react app/i,
  /this project was bootstrapped with/i,
  /available scripts/i,
  /in the project directory, you can run/i,
  /learn more/i,
  /create react app/i,
  /react-scripts/i,
  /npm (start|test|run build|run eject)/i,
  /yarn (start|test|build|eject)/i,
];

const isBoilerplateLine = (line: string) =>
  BOILERPLATE_PATTERNS.some((pattern) => pattern.test(line));

const sanitizeMarkdownLine = (line: string) =>
  line
    .replace(/^[*-]\s+/, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const extractMarkdownExcerpt = (markdown: string | null) => {
  if (!markdown) {
    return null;
  }
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => sanitizeMarkdownLine(line.replace(/^#+\s*/, "").trim()))
    .filter(
      (line) =>
        line.length > 0 &&
        !/^[-_=]{3,}$/.test(line) &&
        !line.startsWith("```") &&
        !line.startsWith(">") &&
        !line.startsWith("![") &&
        !line.startsWith("[!") &&
        !isBoilerplateLine(line)
    );

  if (!lines.length) {
    return null;
  }

  const text = unique(lines).slice(0, 6).join(" ");
  if (text.length <= 280) {
    return text;
  }
  return `${text.slice(0, 277)}...`;
};

const pickTopLanguages = (languages: Record<string, number> | null) => {
  if (!languages) {
    return [];
  }
  return Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name]) => name);
};

const parsePackageJsonDeps = (packageJson: string | null) => {
  if (!packageJson) {
    return [];
  }
  try {
    const parsed = JSON.parse(packageJson) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return unique([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
      ...Object.keys(parsed.peerDependencies ?? {}),
    ]);
  } catch {
    return [];
  }
};

const detectPythonSignals = (requirements: string | null, pyproject: string | null) => {
  const combined = `${requirements ?? ""}\n${pyproject ?? ""}`.toLowerCase();
  const signals: string[] = [];
  if (combined.includes("fastapi")) signals.push("FastAPI");
  if (combined.includes("django")) signals.push("Django");
  if (combined.includes("flask")) signals.push("Flask");
  if (combined.includes("pandas")) signals.push("Pandas");
  if (combined.includes("numpy")) signals.push("NumPy");
  if (combined.includes("sqlalchemy")) signals.push("SQLAlchemy");
  if (combined.includes("celery")) signals.push("Celery");
  return signals;
};

const detectNodeSignals = (deps: string[]) => {
  const lower = deps.map((dep) => dep.toLowerCase());
  const has = (name: string) => lower.includes(name.toLowerCase());
  const signals: string[] = [];
  if (has("next")) signals.push("Next.js");
  if (has("react")) signals.push("React");
  if (has("react-native")) signals.push("React Native");
  if (has("vue")) signals.push("Vue");
  if (has("@angular/core")) signals.push("Angular");
  if (has("svelte")) signals.push("Svelte");
  if (has("astro")) signals.push("Astro");
  if (has("express")) signals.push("Express");
  if (has("@nestjs/core")) signals.push("NestJS");
  if (has("fastify")) signals.push("Fastify");
  if (has("koa")) signals.push("Koa");
  if (has("tailwindcss")) signals.push("Tailwind CSS");
  if (has("prisma")) signals.push("Prisma");
  return signals;
};

const detectFileSignals = (filePaths: string[]) => {
  const lowerPaths = filePaths.map((path) => path.toLowerCase());
  const hasPath = (matcher: (path: string) => boolean) => lowerPaths.some(matcher);
  const signals: string[] = [];

  if (hasPath((path) => path.endsWith("dockerfile"))) signals.push("Docker");
  if (hasPath((path) => path.endsWith("docker-compose.yml"))) signals.push("Docker Compose");
  if (hasPath((path) => path.includes(".github/workflows/"))) signals.push("GitHub Actions");
  if (hasPath((path) => path.endsWith("terraform.tfstate"))) signals.push("Terraform");
  if (hasPath((path) => path.endsWith(".tf"))) signals.push("Terraform");
  if (hasPath((path) => path.includes("k8s/"))) signals.push("Kubernetes");
  if (hasPath((path) => path.includes("helm/"))) signals.push("Helm");
  if (hasPath((path) => path.endsWith("go.mod"))) signals.push("Go Modules");
  if (hasPath((path) => path.endsWith("cargo.toml"))) signals.push("Rust");
  if (hasPath((path) => path.endsWith("pom.xml"))) signals.push("Maven");
  if (hasPath((path) => path.endsWith("build.gradle"))) signals.push("Gradle");
  if (hasPath((path) => path.endsWith("gemfile"))) signals.push("Ruby");
  if (hasPath((path) => path.endsWith(".csproj"))) signals.push(".NET");
  if (hasPath((path) => path.endsWith("makefile"))) signals.push("Makefile");
  if (hasPath((path) => path.endsWith("vite.config.ts"))) signals.push("Vite");
  if (hasPath((path) => path.endsWith("next.config.js"))) signals.push("Next.js");
  if (hasPath((path) => path.endsWith("next.config.ts"))) signals.push("Next.js");

  return unique(signals);
};

const clampText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
};

const buildSummaryText = (
  description: string | null,
  readmeExcerpt: string | null,
  markdownExcerpts: Array<{ file: string; excerpt: string }>,
  topics: string[]
) => {
  const parts: string[] = [];
  const addUnique = (value: string | null) => {
    if (!value) {
      return;
    }
    if (parts.some((existing) => isTooSimilar(existing, value))) {
      return;
    }
    parts.push(value);
  };

  addUnique(description);
  const allowExtra = !description || description.length < 120;
  if (allowExtra) {
    addUnique(readmeExcerpt);
    markdownExcerpts.forEach((item) => addUnique(item.excerpt));
  }

  if (parts.length) {
    return clampText(parts.join(" "), 320);
  }

  if (topics.length) {
    return `Repository focused on ${topics.slice(0, 4).join(", ")}.`;
  }

  return "Repository summary not available.";
};

export const buildRepoSummary = (input: RepoSummaryInput): RepoSummaryResponse => {
  const readmeExcerpt = extractMarkdownExcerpt(input.readme);
  const additionalMarkdowns = input.additionalMarkdowns
    .map((item) => ({
      file: item.file,
      excerpt: extractMarkdownExcerpt(item.content),
    }))
    .filter((item): item is { file: string; excerpt: string } => Boolean(item.excerpt))
    .slice(0, 3);
  const dependencyList = parsePackageJsonDeps(input.packageJson);

  const baseSignals: string[] = [];
  if (input.packageJson) {
    baseSignals.push("Node.js");
  }
  if (input.requirements || input.pyproject) {
    baseSignals.push("Python");
  }

  const dependencySignals = unique([
    ...baseSignals,
    ...detectNodeSignals(dependencyList),
    ...detectPythonSignals(input.requirements, input.pyproject),
  ]);

  const fileSignals = detectFileSignals(input.filePaths);
  const languages = input.languages ?? {};
  const languageSignals = pickTopLanguages(languages);

  const techStack = unique([...languageSignals, ...dependencySignals, ...fileSignals]).slice(0, 12);

  const summary = buildSummaryText(
    input.description,
    readmeExcerpt,
    additionalMarkdowns,
    input.topics
  );
  const filteredMarkdowns = additionalMarkdowns.filter(
    (item) => !isTooSimilar(item.excerpt, summary)
  );

  return {
    summary,
    readmeExcerpt,
    additionalMarkdowns: filteredMarkdowns,
    techStack,
    dependencySignals,
    fileSignals,
    languages,
    topics: input.topics,
    defaultBranch: input.defaultBranch,
    license: input.license,
    homepage: input.homepage,
    openIssues: input.openIssues,
    size: input.size,
    visibility: input.visibility,
    createdAt: input.createdAt,
    pushedAt: input.pushedAt,
    cloneUrl: input.cloneUrl,
    sshUrl: input.sshUrl,
    gitUrl: input.gitUrl,
    hasIssues: input.hasIssues,
    hasProjects: input.hasProjects,
    hasWiki: input.hasWiki,
    hasPages: input.hasPages,
    hasDiscussions: input.hasDiscussions,
    allowForking: input.allowForking,
    isTemplate: input.isTemplate,
    disabled: input.disabled,
    networkCount: input.networkCount,
    subscribersCount: input.subscribersCount,
    allowSquashMerge: input.allowSquashMerge,
    allowMergeCommit: input.allowMergeCommit,
    allowRebaseMerge: input.allowRebaseMerge,
    allowAutoMerge: input.allowAutoMerge,
    deleteBranchOnMerge: input.deleteBranchOnMerge,
  };
};
