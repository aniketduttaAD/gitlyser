"use client";

import { useState, useEffect } from "react";
import { GitCommit, AlertCircle, Code, TrendingUp, Clock } from "lucide-react";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

type ComparisonAdvancedMetricsProps = {
  profiles: GithubProfile[];
  reposList: GithubRepo[][];
};

type RepoMetrics = {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalOpenIssues: number;
  avgRepoSize: number;
  reposWithIssues: number;
  reposWithWiki: number;
  reposWithPages: number;
  mostStarredRepo: { name: string; stars: number } | null;
  newestRepo: { name: string; date: string } | null;
  oldestRepo: { name: string; date: string } | null;
  languagesCount: number;
  totalCommits: number;
};

export default function ComparisonAdvancedMetrics({
  profiles,
  reposList,
}: ComparisonAdvancedMetricsProps) {
  const [metrics, setMetrics] = useState<RepoMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = () => {
      const calculatedMetrics: RepoMetrics[] = profiles.map((profile, index) => {
        const repos = reposList[index] || [];

        if (repos.length === 0) {
          return {
            totalRepos: 0,
            totalStars: 0,
            totalForks: 0,
            totalWatchers: 0,
            totalOpenIssues: 0,
            avgRepoSize: 0,
            reposWithIssues: 0,
            reposWithWiki: 0,
            reposWithPages: 0,
            mostStarredRepo: null,
            newestRepo: null,
            oldestRepo: null,
            languagesCount: 0,
            totalCommits: 0,
          };
        }

        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const totalWatchers = repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0);
        const totalOpenIssues = repos.reduce((sum, repo) => sum + repo.open_issues_count, 0);
        const totalSize = repos.reduce((sum, repo) => sum + (repo.size || 0), 0);
        const avgRepoSize = repos.length > 0 ? totalSize / repos.length : 0;

        const reposWithIssues = repos.filter((repo) => repo.has_issues).length;
        const reposWithWiki = repos.filter((repo) => repo.has_wiki).length;
        const reposWithPages = repos.filter((repo) => repo.has_pages).length;

        const mostStarredRepo = repos.reduce(
          (max, repo) =>
            repo.stargazers_count > (max?.stars || 0)
              ? { name: repo.name, stars: repo.stargazers_count }
              : max,
          null as { name: string; stars: number } | null
        );

        const sortedByDate = [...repos].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const newestRepo =
          sortedByDate.length > 0
            ? { name: sortedByDate[0].name, date: sortedByDate[0].created_at }
            : null;
        const oldestRepo =
          sortedByDate.length > 0
            ? {
                name: sortedByDate[sortedByDate.length - 1].name,
                date: sortedByDate[sortedByDate.length - 1].created_at,
              }
            : null;

        const uniqueLanguages = new Set(repos.map((repo) => repo.language).filter(Boolean));
        const languagesCount = uniqueLanguages.size;

        const recentActivity = repos.filter(
          (repo) =>
            repo.pushed_at &&
            new Date(repo.pushed_at).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
        ).length;
        const totalCommits = recentActivity * 10;

        return {
          totalRepos: repos.length,
          totalStars,
          totalForks,
          totalWatchers,
          totalOpenIssues,
          avgRepoSize,
          reposWithIssues,
          reposWithWiki,
          reposWithPages,
          mostStarredRepo,
          newestRepo,
          oldestRepo,
          languagesCount,
          totalCommits,
        };
      });

      setMetrics(calculatedMetrics);
      setLoading(false);
    };

    calculateMetrics();
  }, [profiles, reposList]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Advanced Metrics</h3>
        <p className="text-sm text-[#6f665b]">Calculating metrics...</p>
      </div>
    );
  }

  const formatSize = (size: number) => {
    if (size < 1024) return `${size.toFixed(0)} KB`;
    return `${(size / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Repository Health Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile, index) => {
            const metric = metrics[index];
            if (!metric) return null;

            return (
              <div key={profile.login} className="space-y-3">
                <h4 className="text-sm font-semibold text-[#5f564d] uppercase tracking-wide">
                  @{profile.login}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-[#6f665b]" />
                      <span className="text-xs text-[#7a7064]">Open Issues</span>
                    </div>
                    <p className="text-lg font-bold text-[#2f2a24]">{metric.totalOpenIssues}</p>
                  </div>
                  <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Code className="h-3 w-3 text-[#6f665b]" />
                      <span className="text-xs text-[#7a7064]">Languages</span>
                    </div>
                    <p className="text-lg font-bold text-[#2f2a24]">{metric.languagesCount}</p>
                  </div>
                  <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-[#6f665b]" />
                      <span className="text-xs text-[#7a7064]">Avg Size</span>
                    </div>
                    <p className="text-sm font-bold text-[#2f2a24]">
                      {formatSize(metric.avgRepoSize)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <GitCommit className="h-3 w-3 text-[#6f665b]" />
                      <span className="text-xs text-[#7a7064]">Watchers</span>
                    </div>
                    <p className="text-lg font-bold text-[#2f2a24]">{metric.totalWatchers}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Repository Features</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile, index) => {
            const metric = metrics[index];
            if (!metric) return null;

            const totalFeatures =
              metric.reposWithIssues + metric.reposWithWiki + metric.reposWithPages;
            const featurePercentage =
              metric.totalRepos > 0 ? (totalFeatures / (metric.totalRepos * 3)) * 100 : 0;

            return (
              <div key={profile.login} className="space-y-3">
                <h4 className="text-sm font-semibold text-[#5f564d] uppercase tracking-wide">
                  @{profile.login}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6f665b]">Repos with Issues</span>
                    <span className="font-semibold text-[#2f2a24]">
                      {metric.reposWithIssues} / {metric.totalRepos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6f665b]">Repos with Wiki</span>
                    <span className="font-semibold text-[#2f2a24]">
                      {metric.reposWithWiki} / {metric.totalRepos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6f665b]">Repos with Pages</span>
                    <span className="font-semibold text-[#2f2a24]">
                      {metric.reposWithPages} / {metric.totalRepos}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#e2d6c8]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#7a7064]">Feature Coverage</span>
                      <span className="text-xs font-semibold text-[#2f2a24]">
                        {featurePercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#e2d6c8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4f6d6a] rounded-full transition-all"
                        style={{ width: `${featurePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Top Repositories</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile, index) => {
            const metric = metrics[index];
            if (!metric) return null;

            return (
              <div key={profile.login} className="space-y-3">
                <h4 className="text-sm font-semibold text-[#5f564d] uppercase tracking-wide">
                  @{profile.login}
                </h4>
                <div className="space-y-2">
                  {metric.mostStarredRepo && (
                    <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-[#6f665b]" />
                        <span className="text-xs text-[#7a7064]">Most Starred</span>
                      </div>
                      <p className="text-sm font-semibold text-[#2f2a24] truncate">
                        {metric.mostStarredRepo.name}
                      </p>
                      <p className="text-xs text-[#6f665b]">
                        {metric.mostStarredRepo.stars.toLocaleString()} stars
                      </p>
                    </div>
                  )}
                  {metric.newestRepo && (
                    <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-[#6f665b]" />
                        <span className="text-xs text-[#7a7064]">Newest</span>
                      </div>
                      <p className="text-sm font-semibold text-[#2f2a24] truncate">
                        {metric.newestRepo.name}
                      </p>
                      <p className="text-xs text-[#6f665b]">
                        Created {formatDate(metric.newestRepo.date)}
                      </p>
                    </div>
                  )}
                  {metric.oldestRepo && (
                    <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-[#6f665b]" />
                        <span className="text-xs text-[#7a7064]">Oldest</span>
                      </div>
                      <p className="text-sm font-semibold text-[#2f2a24] truncate">
                        {metric.oldestRepo.name}
                      </p>
                      <p className="text-xs text-[#6f665b]">
                        Created {formatDate(metric.oldestRepo.date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
