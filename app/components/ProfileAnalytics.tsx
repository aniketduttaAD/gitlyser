"use client";

import dynamic from "next/dynamic";
import ContributionHeatmap from "./ContributionHeatmap";
import ActivityTimeline from "./ActivityTimeline";
import type { GithubRepo, RepoSummaryResponse, GithubProfile } from "@/lib/github/types";

const LanguagePieChart = dynamic(() => import("./charts/LanguagePieChart"), {
  loading: () => (
    <div className="h-[380px] sm:h-[450px] rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] animate-pulse" />
  ),
  ssr: false,
});

const LanguageBarChart = dynamic(() => import("./charts/LanguageBarChart"), {
  loading: () => (
    <div className="h-[380px] sm:h-[450px] rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] animate-pulse" />
  ),
  ssr: false,
});

const RepoSizeChart = dynamic(() => import("./charts/RepoSizeChart"), {
  loading: () => (
    <div className="h-[380px] sm:h-[450px] rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] animate-pulse" />
  ),
  ssr: false,
});

type ProfileAnalyticsProps = {
  repos: GithubRepo[];
  profile?: GithubProfile;
  summaries?: Record<string, RepoSummaryResponse>;
  loading?: boolean;
};

export default function ProfileAnalytics({
  repos,
  profile,
  summaries,
  loading,
}: ProfileAnalyticsProps) {
  if (repos.length === 0 && !profile) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-[#2f2a24]">Charts & Visualizations</h2>
      <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <LanguagePieChart repos={repos} summaries={summaries} loading={loading} />
        </div>
        <div className="md:col-span-1">
          <LanguageBarChart repos={repos} summaries={summaries} loading={loading} />
        </div>
        <div className="md:col-span-2">
          <RepoSizeChart repos={repos} loading={loading} />
        </div>
        {profile && (
          <>
            <div className="md:col-span-2">
              <ContributionHeatmap
                username={profile.login}
                profileCreatedAt={profile.created_at}
                loading={loading}
              />
            </div>
            <div className="md:col-span-2">
              <ActivityTimeline username={profile.login} loading={loading} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
