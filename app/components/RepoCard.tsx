"use client";

import {
  LuBug,
  LuCalendarDays,
  LuCode,
  LuExternalLink,
  LuEye,
  LuFileText,
  LuGitBranch,
  LuGitFork,
  LuGitPullRequest,
  LuGlobe,
  LuScale,
  LuSparkles,
  LuStar,
  LuTag,
  LuClock,
  LuCopy,
  LuLock,
  LuCheck,
  LuCircleAlert,
  LuBookOpen,
  LuFolderKanban,
  LuMessageSquare,
  LuLayers,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { useState, type ReactNode } from "react";
import type {
  GithubRepo,
  PullRequestGroup,
  RepoSummaryResponse,
  PRAnalytics as PRAnalyticsType,
  RepoHealthScore as RepoHealthScoreType,
  CodeQualityMetrics as CodeQualityMetricsType,
} from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";
import BaseSkeleton from "./skeletons/BaseSkeleton";
import PRAnalytics from "./PRAnalytics";
import RepoHealthScore from "./RepoHealthScore";
import CodeQualityMetrics from "./CodeQualityMetrics";

type RepoCardProps = {
  repo: GithubRepo;
  owner: string;
  openaiKey: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-[#e2d6c8] bg-[#f1e6d8] px-2 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-xs text-[#6f665b] break-words">
    {children}
  </span>
);

const Metric = ({ icon: Icon, children }: { icon: IconType; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#e2d6c8] bg-[#f3ede4] px-2 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-xs text-[#6f665b]">
    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
    <span className="whitespace-nowrap">{children}</span>
  </span>
);

const formatSize = (sizeInKb: number) => {
  if (sizeInKb >= 1024) {
    return `${(sizeInKb / 1024).toFixed(1)} MB`;
  }
  return `${sizeInKb} KB`;
};

const normalizeUrl = (value: string) => {
  if (!value) {
    return value;
  }
  return value.startsWith("http") ? value : `https://${value}`;
};

export default function RepoCard({ repo, owner, openaiKey }: RepoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<RepoSummaryResponse | null>(null);
  const [prGroups, setPrGroups] = useState<PullRequestGroup[] | null>(null);
  const [prAnalytics, setPrAnalytics] = useState<PRAnalyticsType | null>(null);
  const [repoHealth, setRepoHealth] = useState<RepoHealthScoreType | null>(null);
  const [codeQuality, setCodeQuality] = useState<CodeQualityMetricsType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [metricsErrors, setMetricsErrors] = useState<{
    prAnalytics?: string;
    repoHealth?: string;
    codeQuality?: string;
  }>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const watchers = repo.watchers_count ?? repo.stargazers_count;

  const copyToClipboard = async (text: string, urlType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(urlType);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isContentSimilar = (a: string, b: string) => {
    if (!a || !b) return false;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const normA = normalize(a);
    const normB = normalize(b);
    if (normA.length < 30 || normB.length < 30) return false;
    const shorter = normA.length < normB.length ? normA : normB;
    const longer = normA.length >= normB.length ? normA : normB;
    return longer.includes(shorter.slice(0, Math.min(60, shorter.length)));
  };

  const showReadmeHighlight =
    summary?.readmeExcerpt &&
    summary.readmeExcerpt.length > 50 &&
    !isContentSimilar(summary.summary, summary.readmeExcerpt);

  const loadDetails = async () => {
    setDetailsLoading(true);
    setDetailsError(null);
    setMetricsErrors({});

    const ownerParam = encodeURIComponent(owner);
    const repoParam = encodeURIComponent(repo.name);
    const baseUrl = `/api/github`;

    try {
      const [summaryRes, prRes, prAnalyticsRes, repoHealthRes, codeQualityRes] =
        await Promise.allSettled([
          fetch(`${baseUrl}/repo-summary?owner=${ownerParam}&repo=${repoParam}`),
          fetch(`${baseUrl}/prs?owner=${ownerParam}&repo=${repoParam}`),
          fetch(`${baseUrl}/pr-analytics?owner=${ownerParam}&repo=${repoParam}`),
          fetch(`${baseUrl}/repo-health?owner=${ownerParam}&repo=${repoParam}`),
          fetch(`${baseUrl}/code-quality?owner=${ownerParam}&repo=${repoParam}`),
        ]);

      const errors: string[] = [];
      const newMetricsErrors: typeof metricsErrors = {};

      if (summaryRes.status === "fulfilled") {
        if (summaryRes.value.ok) {
          try {
            const summaryData = (await summaryRes.value.json()) as RepoSummaryResponse;
            setSummary(summaryData);
          } catch {
            errors.push("Failed to parse repo summary.");
          }
        } else {
          try {
            const data = await summaryRes.value.json();
            errors.push(data.error ?? "Failed to load repo summary.");
          } catch {
            errors.push("Failed to load repo summary.");
          }
        }
      } else {
        errors.push("Failed to load repo summary.");
      }

      if (prRes.status === "fulfilled") {
        if (prRes.value.ok) {
          try {
            const prData = (await prRes.value.json()) as { groups: PullRequestGroup[] };
            setPrGroups(prData.groups ?? null);
          } catch {
            errors.push("Failed to parse pull requests.");
          }
        } else {
          try {
            const data = await prRes.value.json();
            errors.push(data.error ?? "Failed to load pull requests.");
          } catch {
            errors.push("Failed to load pull requests.");
          }
        }
      } else {
        errors.push("Failed to load pull requests.");
      }

      if (prAnalyticsRes.status === "fulfilled") {
        if (prAnalyticsRes.value.ok) {
          try {
            const analyticsData = (await prAnalyticsRes.value.json()) as PRAnalyticsType;
            setPrAnalytics(analyticsData);
          } catch {
            newMetricsErrors.prAnalytics = "Failed to parse PR analytics.";
          }
        } else {
          try {
            const data = await prAnalyticsRes.value.json();
            newMetricsErrors.prAnalytics = data.error ?? "Failed to load PR analytics.";
          } catch {
            newMetricsErrors.prAnalytics = "Failed to load PR analytics.";
          }
        }
      } else {
        newMetricsErrors.prAnalytics = "Failed to load PR analytics.";
      }

      if (repoHealthRes.status === "fulfilled") {
        if (repoHealthRes.value.ok) {
          try {
            const healthData = (await repoHealthRes.value.json()) as RepoHealthScoreType;
            setRepoHealth(healthData);
          } catch {
            newMetricsErrors.repoHealth = "Failed to parse repo health score.";
          }
        } else {
          try {
            const data = await repoHealthRes.value.json();
            newMetricsErrors.repoHealth = data.error ?? "Failed to load repo health score.";
          } catch {
            newMetricsErrors.repoHealth = "Failed to load repo health score.";
          }
        }
      } else {
        newMetricsErrors.repoHealth = "Failed to load repo health score.";
      }

      if (codeQualityRes.status === "fulfilled") {
        if (codeQualityRes.value.ok) {
          try {
            const qualityData = (await codeQualityRes.value.json()) as CodeQualityMetricsType;
            setCodeQuality(qualityData);
          } catch {
            newMetricsErrors.codeQuality = "Failed to parse code quality metrics.";
          }
        } else {
          try {
            const data = await codeQualityRes.value.json();
            newMetricsErrors.codeQuality = data.error ?? "Failed to load code quality metrics.";
          } catch {
            newMetricsErrors.codeQuality = "Failed to load code quality metrics.";
          }
        }
      } else {
        newMetricsErrors.codeQuality = "Failed to load code quality metrics.";
      }

      if (errors.length) {
        setDetailsError(errors.join(" "));
      }
      setMetricsErrors(newMetricsErrors);
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Failed to load repo details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && (!summary || !prGroups) && !detailsLoading) {
        loadDetails();
      }
      return next;
    });
  };

  const generateAISummary = async () => {
    if (!openaiKey) {
      setAiError("OpenAI API key is required. Please configure it in Smart Summary settings.");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const ownerParam = encodeURIComponent(owner);
      const repoParam = encodeURIComponent(repo.name);

      const [summaryRes, readmeRes, treeRes] = await Promise.all([
        fetch(`/api/github/repo-summary?owner=${ownerParam}&repo=${repoParam}`),
        fetch(`/api/github/readme-full?owner=${ownerParam}&repo=${repoParam}`).catch(() => null),
        fetch(`/api/github/tree?owner=${ownerParam}&repo=${repoParam}`).catch(() => null),
      ]);

      if (!summaryRes.ok) {
        throw new Error("Failed to fetch repository data.");
      }

      const fullSummary = (await summaryRes.json()) as RepoSummaryResponse;

      let readmeText = fullSummary.readmeExcerpt || null;
      if (readmeRes?.ok) {
        try {
          const readmeData = (await readmeRes.json()) as { content: string };
          readmeText = readmeData.content || readmeText;
        } catch {}
      }

      let filePaths: string[] = [];
      if (treeRes?.ok) {
        try {
          const treeData = (await treeRes.json()) as { paths: string[] };
          filePaths = treeData.paths || [];
        } catch {}
      }

      const additionalMarkdownsWithFullContent = await Promise.all(
        fullSummary.additionalMarkdowns.map(async (md) => {
          try {
            const fullContentRes = await fetch(
              `/api/github/readme-full?owner=${ownerParam}&repo=${repoParam}&file=${encodeURIComponent(md.file)}`
            ).catch(() => null);

            if (fullContentRes?.ok) {
              const fullContentData = (await fullContentRes.json()) as { content: string | null };
              const content = fullContentData.content || md.excerpt || null;
              return {
                file: md.file,
                content: content,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch full content for ${md.file}:`, error);
          }

          return {
            file: md.file,
            content: md.excerpt || null,
          };
        })
      );

      const repoData = {
        name: repo.name,
        description: repo.description,
        readme: readmeText,
        additionalMarkdowns: additionalMarkdownsWithFullContent,
        languages: fullSummary.languages,
        topics: fullSummary.topics,
        techStack: fullSummary.techStack,
        filePaths: filePaths.length > 0 ? filePaths : [],
        defaultBranch: fullSummary.defaultBranch,
        license: fullSummary.license,
        homepage: fullSummary.homepage,
        openIssues: fullSummary.openIssues,
        size: fullSummary.size,
        visibility: fullSummary.visibility,
        createdAt: fullSummary.createdAt,
        pushedAt: fullSummary.pushedAt,
        cloneUrl: fullSummary.cloneUrl,
        sshUrl: fullSummary.sshUrl,
        gitUrl: fullSummary.gitUrl,
        hasIssues: fullSummary.hasIssues,
        hasProjects: fullSummary.hasProjects,
        hasWiki: fullSummary.hasWiki,
        hasPages: fullSummary.hasPages,
        hasDiscussions: fullSummary.hasDiscussions,
        allowForking: fullSummary.allowForking,
        isTemplate: fullSummary.isTemplate,
        disabled: fullSummary.disabled,
        networkCount: fullSummary.networkCount,
        subscribersCount: fullSummary.subscribersCount,
        allowSquashMerge: fullSummary.allowSquashMerge,
        allowMergeCommit: fullSummary.allowMergeCommit,
        allowRebaseMerge: fullSummary.allowRebaseMerge,
        allowAutoMerge: fullSummary.allowAutoMerge,
        deleteBranchOnMerge: fullSummary.deleteBranchOnMerge,
      };

      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openaiKey,
          repoData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to generate AI summary.");
      }

      const data = (await response.json()) as { summary: string };
      setAiSummary(data.summary);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Failed to generate AI summary.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <article className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-3 sm:p-6 shadow-sm transition hover:shadow-md overflow-hidden">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-lg sm:text-xl font-semibold text-[#2f2a24] hover:text-[#3f5d5a] transition-colors break-words"
            >
              {repo.name}
            </a>
            <div className="flex items-center gap-2 flex-wrap">
              {repo.fork && <Badge>Fork</Badge>}
              {repo.archived && <Badge>Archived</Badge>}
            </div>
          </div>
          {repo.description && (
            <p className="text-xs sm:text-sm text-[#6f665b] leading-relaxed break-words">
              {repo.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {repo.language && <Badge>{repo.language}</Badge>}
            <Metric icon={LuStar}>{repo.stargazers_count}</Metric>
            <Metric icon={LuGitFork}>{repo.forks_count}</Metric>
            <Metric icon={LuEye}>{watchers}</Metric>
            <Metric icon={LuBug}>{repo.open_issues_count}</Metric>
            <Metric icon={LuCalendarDays}>
              <span className="hidden xs:inline">Updated </span>
              {formatDate(repo.updated_at)}
            </Metric>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleExpanded}
          className="h-10 w-full md:w-auto flex-shrink-0 whitespace-nowrap rounded-xl border border-[#e2d6c8] bg-[#f3ede4] px-5 text-sm font-semibold text-[#5b5146] transition hover:border-[#b8c6c3] hover:bg-[#e9e5dc] hover:text-[#3f5d5a] md:self-start"
        >
          {expanded ? "Hide Details" : "View Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 border-t border-[#e2d6c8] pt-4 sm:pt-6">
          {detailsLoading && (
            <div className="space-y-4">
              <ChartSkeleton />
              <div className="grid gap-4 md:grid-cols-2">
                <BaseSkeleton height={200} width="100%" className="h-48 rounded-xl" />
                <BaseSkeleton height={200} width="100%" className="h-48 rounded-xl" />
              </div>
            </div>
          )}
          {detailsError && <p className="text-sm text-rose-600">{detailsError}</p>}
          {summary && (
            <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <p className="text-xs uppercase tracking-wide text-[#7a7064] font-semibold">
                      Project Overview
                    </p>
                    {openaiKey && (
                      <button
                        type="button"
                        onClick={generateAISummary}
                        disabled={aiLoading || detailsLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-[#cfdad7] bg-[#e9efee] px-3 py-1.5 text-xs font-semibold text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                      >
                        <LuSparkles
                          className={`h-3.5 w-3.5 ${aiLoading ? "animate-pulse" : ""}`}
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">
                          {aiLoading
                            ? "Generating..."
                            : aiSummary
                              ? "Regenerate Summary"
                              : "Smart Summary"}
                        </span>
                        <span className="sm:hidden">
                          {aiLoading ? "..." : aiSummary ? "Regenerate" : "Smart"}
                        </span>
                      </button>
                    )}
                  </div>
                  {aiSummary ? (
                    <div className="rounded-xl border border-[#cfdad7] bg-[#e9efee] p-3 sm:p-4 text-xs sm:text-sm text-[#5f564d]">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3 text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#4f6d6a] font-semibold">
                        <LuSparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                        Smart Summary
                      </div>
                      <div className="prose prose-sm max-w-none text-[#5f564d] leading-relaxed break-words">
                        {aiSummary.split("\n\n").map((paragraph, idx) => (
                          <p key={idx} className="mb-2 sm:mb-3 last:mb-0 break-words">
                            {paragraph.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs sm:text-sm text-[#5f564d] leading-relaxed break-words">
                      {summary.summary}
                    </p>
                  )}
                  {aiLoading && !aiSummary && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#6f665b]">
                      <LuSparkles
                        className="h-4 w-4 animate-pulse text-[#4f6d6a]"
                        aria-hidden="true"
                      />
                      <span>Generating smart summary...</span>
                    </div>
                  )}
                  {aiError && (
                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                      {aiError.includes("OpenAI API key")
                        ? aiError.replace("AI Settings", "Smart Summary settings")
                        : aiError}
                    </div>
                  )}
                </div>
                {summary.techStack.length > 0 && (
                  <div>
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 font-semibold">
                      Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {summary.techStack.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(showReadmeHighlight || summary.additionalMarkdowns.length > 0) && (
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] font-semibold">
                      Docs Highlights
                    </p>
                    {showReadmeHighlight && summary.readmeExcerpt && (
                      <div className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] p-2.5 sm:p-3 text-xs sm:text-sm text-[#5f564d]">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064]">
                          <LuFileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                          README
                        </div>
                        <p className="mt-1.5 sm:mt-2 break-words">{summary.readmeExcerpt}</p>
                      </div>
                    )}
                    {summary.additionalMarkdowns.map((item) => (
                      <div
                        key={item.file}
                        className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2.5 sm:p-3 text-xs sm:text-sm text-[#5f564d]"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064]">
                          <LuFileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                          {item.file}
                        </div>
                        <p className="mt-1.5 sm:mt-2 break-words">{item.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(summary.dependencySignals.length > 0 || summary.fileSignals.length > 0) && (
                  <div>
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 font-semibold">
                      Detected Features
                    </p>
                    <p className="text-[0.65rem] sm:text-xs text-[#6f665b] mb-1.5">
                      Technologies and features detected from dependencies and file structure
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {summary.dependencySignals.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                      {summary.fileSignals.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 sm:space-y-4">
                {/* Basic Information */}
                <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2.5 sm:p-4 shadow-sm overflow-hidden">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 sm:mb-3 font-semibold">
                    Basic Information
                  </p>
                  <div className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-[#6f665b]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuGitBranch
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Default branch</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right break-all">
                        {summary.defaultBranch}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuEye
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Visibility</span>
                      </div>
                      <span className="font-medium text-[#5f564d] capitalize sm:text-right">
                        {summary.visibility}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuScale
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>License</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right break-words">
                        {summary.license ?? "Not specified"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuCode
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Size</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right">
                        {formatSize(summary.size)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuBug
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Open issues</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right">
                        {summary.openIssues}
                      </span>
                    </div>
                    {summary.networkCount > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <LuGitFork
                            className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span>Fork network</span>
                        </div>
                        <span className="font-medium text-[#5f564d] sm:text-right">
                          {summary.networkCount}
                        </span>
                      </div>
                    )}
                    {summary.subscribersCount > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <LuEye
                            className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span>Subscribers</span>
                        </div>
                        <span className="font-medium text-[#5f564d] sm:text-right">
                          {summary.subscribersCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2.5 sm:p-4 shadow-sm overflow-hidden">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 sm:mb-3 font-semibold">
                    Timeline
                  </p>
                  <div className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-[#6f665b]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuClock
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Created</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right">
                        {formatDate(summary.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <LuCalendarDays
                          className="h-4 w-4 text-[#7a7064] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Last pushed</span>
                      </div>
                      <span className="font-medium text-[#5f564d] sm:text-right">
                        {formatDate(summary.pushedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features & Settings */}
                {(() => {
                  const hasFeatures =
                    summary.isTemplate ||
                    summary.hasPages ||
                    summary.hasDiscussions ||
                    summary.hasProjects ||
                    summary.hasWiki ||
                    !summary.hasIssues ||
                    !summary.allowForking ||
                    summary.disabled;

                  if (!hasFeatures) return null;

                  return (
                    <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-3 sm:p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-[#7a7064] mb-3 font-semibold">
                        Features & Settings
                      </p>
                      <div className="space-y-2 text-sm">
                        {summary.isTemplate && (
                          <div className="flex items-center gap-2 text-[#4f6d6a]">
                            <LuLayers className="h-4 w-4" aria-hidden="true" />
                            <span className="font-medium">Template repository</span>
                          </div>
                        )}
                        {summary.hasPages && (
                          <div className="flex items-center gap-2 text-[#4f6d6a]">
                            <LuGlobe className="h-4 w-4" aria-hidden="true" />
                            <span>GitHub Pages enabled</span>
                          </div>
                        )}
                        {summary.hasDiscussions && (
                          <div className="flex items-center gap-2 text-[#4f6d6a]">
                            <LuMessageSquare className="h-4 w-4" aria-hidden="true" />
                            <span>Discussions enabled</span>
                          </div>
                        )}
                        {summary.hasProjects && (
                          <div className="flex items-center gap-2 text-[#4f6d6a]">
                            <LuFolderKanban className="h-4 w-4" aria-hidden="true" />
                            <span>Projects enabled</span>
                          </div>
                        )}
                        {summary.hasWiki && (
                          <div className="flex items-center gap-2 text-[#4f6d6a]">
                            <LuBookOpen className="h-4 w-4" aria-hidden="true" />
                            <span>Wiki enabled</span>
                          </div>
                        )}
                        {!summary.hasIssues && (
                          <div className="flex items-center gap-2 text-[#8a7e72]">
                            <LuBug className="h-4 w-4" aria-hidden="true" />
                            <span>Issues disabled</span>
                          </div>
                        )}
                        {!summary.allowForking && (
                          <div className="flex items-center gap-2 text-[#8a7e72]">
                            <LuLock className="h-4 w-4" aria-hidden="true" />
                            <span>Forking disabled</span>
                          </div>
                        )}
                        {summary.disabled && (
                          <div className="flex items-center gap-2 text-rose-600">
                            <LuCircleAlert className="h-4 w-4" aria-hidden="true" />
                            <span className="font-medium">Repository disabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Merge Settings */}
                {(() => {
                  const hasNonDefaultMergeSettings =
                    !summary.allowSquashMerge ||
                    !summary.allowMergeCommit ||
                    !summary.allowRebaseMerge ||
                    summary.allowAutoMerge ||
                    summary.deleteBranchOnMerge;

                  if (!hasNonDefaultMergeSettings) return null;

                  return (
                    <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2.5 sm:p-4 shadow-sm overflow-hidden">
                      <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 sm:mb-3 font-semibold">
                        Merge Settings
                      </p>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#6f665b]">
                        {(!summary.allowSquashMerge ||
                          !summary.allowMergeCommit ||
                          !summary.allowRebaseMerge) && (
                          <>
                            {!summary.allowSquashMerge && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                <span className="break-words">Squash merge</span>
                                <span className="flex items-center gap-1 text-[#8a7e72] sm:justify-end">
                                  <LuLock
                                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                    aria-hidden="true"
                                  />
                                  Disabled
                                </span>
                              </div>
                            )}
                            {!summary.allowMergeCommit && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                <span className="break-words">Merge commit</span>
                                <span className="flex items-center gap-1 text-[#8a7e72] sm:justify-end">
                                  <LuLock
                                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                    aria-hidden="true"
                                  />
                                  Disabled
                                </span>
                              </div>
                            )}
                            {!summary.allowRebaseMerge && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                <span className="break-words">Rebase merge</span>
                                <span className="flex items-center gap-1 text-[#8a7e72] sm:justify-end">
                                  <LuLock
                                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                    aria-hidden="true"
                                  />
                                  Disabled
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {summary.allowAutoMerge && (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[#4f6d6a]">
                            <span className="break-words">Auto-merge</span>
                            <span className="font-medium sm:text-right">Enabled</span>
                          </div>
                        )}
                        {summary.deleteBranchOnMerge && (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[#4f6d6a]">
                            <span className="break-words">Auto-delete branch</span>
                            <span className="font-medium sm:text-right">Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Clone URLs & Links */}
                {(summary.cloneUrl || summary.sshUrl || summary.gitUrl || summary.homepage) && (
                  <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2.5 sm:p-4 shadow-sm overflow-hidden">
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 sm:mb-3 font-semibold">
                      Clone & Links
                    </p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {summary.cloneUrl && (
                        <div className="group flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 rounded-lg border border-[#cfdad7] bg-[#e9efee] p-2 transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4]">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <LuCopy
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#4f6d6a] flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-[0.65rem] sm:text-xs font-semibold text-[#4f6d6a] whitespace-nowrap">
                                  HTTPS
                                </span>
                                <span className="text-[0.65rem] sm:text-xs text-[#6f665b] font-mono break-all sm:truncate flex-1">
                                  {summary.cloneUrl}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(summary.cloneUrl, "https");
                            }}
                            className="flex items-center justify-center gap-1 rounded px-2 py-1 text-[0.65rem] sm:text-xs font-medium text-[#4f6d6a] transition hover:bg-[#c9d5d4] flex-shrink-0 w-full sm:w-auto"
                            title="Copy HTTPS URL"
                          >
                            {copiedUrl === "https" ? (
                              <>
                                <LuCheck
                                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#426a4b]"
                                  aria-hidden="true"
                                />
                                <span className="sm:hidden">Copied!</span>
                              </>
                            ) : (
                              <>
                                <LuCopy className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                                <span className="sm:hidden">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {summary.sshUrl && (
                        <div className="group flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 rounded-lg border border-[#cfdad7] bg-[#e9efee] p-2 transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4]">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <LuCopy
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#4f6d6a] flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-[0.65rem] sm:text-xs font-semibold text-[#4f6d6a] whitespace-nowrap">
                                  SSH
                                </span>
                                <span className="text-[0.65rem] sm:text-xs text-[#6f665b] font-mono break-all sm:truncate flex-1">
                                  {summary.sshUrl}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(summary.sshUrl!, "ssh");
                            }}
                            className="flex items-center justify-center gap-1 rounded px-2 py-1 text-[0.65rem] sm:text-xs font-medium text-[#4f6d6a] transition hover:bg-[#c9d5d4] flex-shrink-0 w-full sm:w-auto"
                            title="Copy SSH URL"
                          >
                            {copiedUrl === "ssh" ? (
                              <>
                                <LuCheck
                                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#426a4b]"
                                  aria-hidden="true"
                                />
                                <span className="sm:hidden">Copied!</span>
                              </>
                            ) : (
                              <>
                                <LuCopy className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                                <span className="sm:hidden">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {summary.gitUrl && (
                        <div className="group flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 rounded-lg border border-[#cfdad7] bg-[#e9efee] p-2 transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4]">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <LuCopy
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#4f6d6a] flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-[0.65rem] sm:text-xs font-semibold text-[#4f6d6a] whitespace-nowrap">
                                  Git
                                </span>
                                <span className="text-[0.65rem] sm:text-xs text-[#6f665b] font-mono break-all sm:truncate flex-1">
                                  {summary.gitUrl}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(summary.gitUrl!, "git");
                            }}
                            className="flex items-center justify-center gap-1 rounded px-2 py-1 text-[0.65rem] sm:text-xs font-medium text-[#4f6d6a] transition hover:bg-[#c9d5d4] flex-shrink-0 w-full sm:w-auto"
                            title="Copy Git URL"
                          >
                            {copiedUrl === "git" ? (
                              <>
                                <LuCheck
                                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#426a4b]"
                                  aria-hidden="true"
                                />
                                <span className="sm:hidden">Copied!</span>
                              </>
                            ) : (
                              <>
                                <LuCopy className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                                <span className="sm:hidden">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {summary.homepage && (
                        <a
                          href={normalizeUrl(summary.homepage)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-lg border border-[#cfdad7] bg-[#e9efee] p-2 text-xs sm:text-sm text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] break-all"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            <LuGlobe
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium text-xs sm:text-sm truncate">
                              Homepage
                            </span>
                            <span className="text-[0.65rem] sm:text-xs truncate hidden sm:inline">
                              {summary.homepage}
                            </span>
                          </div>
                          <LuExternalLink
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {summary.topics.length > 0 && (
                  <div>
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 font-semibold">
                      Topics
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {summary.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#cfdad7] bg-[#e9efee] px-2 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-xs text-[#4f6d6a]"
                        >
                          <LuTag className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(summary.languages).length > 0 && (
                  <div>
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064] mb-2 font-semibold">
                      Top Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {Object.entries(summary.languages)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 4)
                        .map(([language]) => (
                          <span
                            key={language}
                            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#e2d6c8] bg-[#f1e6d8] px-2 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-xs text-[#6f665b]"
                          >
                            <LuCode className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                            {language}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {prGroups && prGroups.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2.5 sm:space-y-3">
                <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[#7a7064]">
                  Pull Requests by Base Branch
                </p>
                {prGroups.length === 0 ? (
                  <p className="text-xs sm:text-sm text-[#6f665b]">No pull requests found.</p>
                ) : (
                  prGroups.map((group) => (
                    <div
                      key={group.base}
                      className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] p-2.5 sm:p-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm text-[#5f564d]">
                        <span className="inline-flex items-center gap-1.5 sm:gap-2 font-semibold min-w-0 flex-1">
                          <LuGitPullRequest
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{group.base}</span>
                        </span>
                        <span className="text-[0.65rem] sm:text-xs text-[#7a7064] flex-shrink-0 ml-2">
                          {group.count} PRs
                        </span>
                      </div>
                      <div className="mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#6f665b]">
                        {group.recent.map((pr) => (
                          <a
                            key={pr.id}
                            href={pr.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border border-transparent bg-[#fffaf2] p-2 transition hover:border-[#b8c6c3] hover:bg-[#fffdf8]"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                              <span className="text-[#4f453b] break-words">
                                #{pr.number} {pr.title}
                              </span>
                              <span className="text-[0.65rem] sm:text-xs text-[#7a7064] flex-shrink-0">
                                {pr.merged_at
                                  ? "Merged"
                                  : pr.state === "closed"
                                    ? "Closed"
                                    : "Open"}
                              </span>
                            </div>
                            <div className="mt-1 text-[0.65rem] sm:text-xs text-[#8a7e72]">
                              Updated {formatDate(pr.updated_at)}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PR Analytics - Always show when expanded */}
          {summary && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-[#e2d6c8] space-y-3 sm:space-y-4">
              <PRAnalytics
                owner={owner}
                repo={repo.name}
                data={prAnalytics}
                loading={detailsLoading}
                error={metricsErrors.prAnalytics}
              />
              <RepoHealthScore
                owner={owner}
                repo={repo.name}
                data={repoHealth}
                loading={detailsLoading}
                error={metricsErrors.repoHealth}
              />
              <CodeQualityMetrics
                owner={owner}
                repo={repo.name}
                data={codeQuality}
                loading={detailsLoading}
                error={metricsErrors.codeQuality}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
