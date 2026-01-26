"use client";

import { X, CalendarDays, MapPin, Building2, Globe, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";
import ComparisonMetrics from "./comparison/ComparisonMetrics";
import ComparisonLanguages from "./comparison/ComparisonLanguages";
import ComparisonAdvancedMetrics from "./comparison/ComparisonAdvancedMetrics";
import ComparisonActivity from "./comparison/ComparisonActivity";
import AIComparison from "./comparison/AIComparison";

type ComparisonViewProps = {
  profiles: GithubProfile[];
  reposList: GithubRepo[][];
  onRemove: (index: number) => void;
  openaiKey?: string;
};

export default function ComparisonView({
  profiles,
  reposList,
  onRemove,
  openaiKey = "",
}: ComparisonViewProps) {
  if (profiles.length === 0) {
    return null;
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

  const normalizeUrl = (value: string) => {
    if (!value) return value;
    return value.startsWith("http") ? value : `https://${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2f2a24]">Profile Comparison</h2>
        <p className="text-sm text-[#6f665b]">Comparing {profiles.length} of 2 profiles</p>
      </div>

      {/* Profile Cards Side by Side */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {profiles.map((profile, index) => {
          const repos = reposList[index] || [];
          const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
          const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
          const memberSince = formatDate(profile.created_at);
          const blogUrl = profile.blog ? normalizeUrl(profile.blog) : null;

          return (
            <div
              key={profile.login}
              className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm relative"
            >
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#f3ede4] transition z-10"
                aria-label="Remove profile"
              >
                <X className="h-4 w-4 text-[#6f665b]" />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <Image
                  src={profile.avatar_url}
                  alt={profile.login}
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-[#e2d6c8] flex-shrink-0"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#2f2a24] truncate mb-1">
                    {profile.name || profile.login}
                  </h3>
                  <a
                    href={profile.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#4f6d6a] hover:text-[#3f5d5a] truncate block mb-2"
                  >
                    @{profile.login}
                  </a>
                  {profile.bio && (
                    <p className="text-sm text-[#5f564d] line-clamp-2 mb-2">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.location && (
                      <span className="flex items-center gap-1 text-[#6f665b]">
                        <MapPin className="h-3 w-3" />
                        {profile.location}
                      </span>
                    )}
                    {profile.company && (
                      <span className="flex items-center gap-1 text-[#6f665b]">
                        <Building2 className="h-3 w-3" />
                        {profile.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#6f665b]">
                      <CalendarDays className="h-3 w-3" />
                      Since {memberSince}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                  <p className="text-2xl font-bold text-[#2f2a24]">{profile.public_repos}</p>
                  <p className="text-xs text-[#7a7064] uppercase tracking-wide">Repositories</p>
                </div>
                <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                  <p className="text-2xl font-bold text-[#2f2a24]">{profile.followers}</p>
                  <p className="text-xs text-[#7a7064] uppercase tracking-wide">Followers</p>
                </div>
                <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                  <p className="text-2xl font-bold text-[#2f2a24]">{totalStars.toLocaleString()}</p>
                  <p className="text-xs text-[#7a7064] uppercase tracking-wide">Total Stars</p>
                </div>
                <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3">
                  <p className="text-2xl font-bold text-[#2f2a24]">{totalForks.toLocaleString()}</p>
                  <p className="text-xs text-[#7a7064] uppercase tracking-wide">Total Forks</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-xs text-[#6f665b] pt-3 border-t border-[#e2d6c8]">
                <div className="flex items-center justify-between">
                  <span>Following</span>
                  <span className="font-semibold text-[#2f2a24]">{profile.following}</span>
                </div>
                {blogUrl && (
                  <a
                    href={blogUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between hover:text-[#4f6d6a] transition"
                  >
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Website
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex items-center justify-between">
                  <span>Type</span>
                  <span className="font-semibold text-[#2f2a24] uppercase">{profile.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Metrics */}
      <ComparisonMetrics profiles={profiles} reposList={reposList} />

      {/* Language Comparison */}
      <ComparisonLanguages profiles={profiles} reposList={reposList} />

      {/* Advanced Metrics */}
      <ComparisonAdvancedMetrics profiles={profiles} reposList={reposList} />

      {/* Activity Comparison */}
      <ComparisonActivity profiles={profiles} />

      {/* AI Comparison */}
      {profiles.length >= 2 && (
        <AIComparison profiles={profiles} reposList={reposList} openaiKey={openaiKey} />
      )}
    </div>
  );
}
