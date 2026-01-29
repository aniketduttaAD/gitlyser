"use client";

import { LuBookOpen, LuUsers, LuStar, LuGitFork } from "react-icons/lu";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

type ComparisonMetricsProps = {
  profiles: GithubProfile[];
  reposList: GithubRepo[][];
};

export default function ComparisonMetrics({ profiles, reposList }: ComparisonMetricsProps) {
  const calculateTotalStars = (repos: GithubRepo[]) => {
    return repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  };

  const calculateTotalForks = (repos: GithubRepo[]) => {
    return repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  };

  const metrics = profiles.map((profile, index) => ({
    profile: profile.login,
    repos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    stars: calculateTotalStars(reposList[index] || []),
    forks: calculateTotalForks(reposList[index] || []),
  }));

  const maxRepos = Math.max(...metrics.map((m) => m.repos));
  const maxFollowers = Math.max(...metrics.map((m) => m.followers));
  const maxStars = Math.max(...metrics.map((m) => m.stars));

  return (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Comparison Metrics</h3>
      <div className="space-y-4">
        {/* Repositories */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LuBookOpen className="h-4 w-4 text-[#6f665b]" />
            <span className="text-sm font-medium text-[#5f564d]">Public Repositories</span>
          </div>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.profile}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#6f665b]">@{metric.profile}</span>
                  <span className="text-sm font-semibold text-[#2f2a24]">{metric.repos}</span>
                </div>
                <div className="h-2 bg-[#e2d6c8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4f6d6a] rounded-full transition-all"
                    style={{ width: `${(metric.repos / maxRepos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Followers */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LuUsers className="h-4 w-4 text-[#6f665b]" />
            <span className="text-sm font-medium text-[#5f564d]">Followers</span>
          </div>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.profile}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#6f665b]">@{metric.profile}</span>
                  <span className="text-sm font-semibold text-[#2f2a24]">{metric.followers}</span>
                </div>
                <div className="h-2 bg-[#e2d6c8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4f6d6a] rounded-full transition-all"
                    style={{ width: `${(metric.followers / maxFollowers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Stars */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LuStar className="h-4 w-4 text-[#6f665b]" />
            <span className="text-sm font-medium text-[#5f564d]">Total Stars</span>
          </div>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.profile}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#6f665b]">@{metric.profile}</span>
                  <span className="text-sm font-semibold text-[#2f2a24]">{metric.stars}</span>
                </div>
                <div className="h-2 bg-[#e2d6c8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4f6d6a] rounded-full transition-all"
                    style={{
                      width: `${maxStars > 0 ? (metric.stars / maxStars) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Forks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LuGitFork className="h-4 w-4 text-[#6f665b]" />
            <span className="text-sm font-medium text-[#5f564d]">Total Forks</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.profile} className="text-center">
                <p className="text-2xl font-bold text-[#2f2a24]">{metric.forks}</p>
                <p className="text-xs text-[#7a7064]">@{metric.profile}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
