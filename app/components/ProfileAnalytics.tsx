"use client";

import LanguagePieChart from "./charts/LanguagePieChart";
import LanguageBarChart from "./charts/LanguageBarChart";
import RepoSizeChart from "./charts/RepoSizeChart";
import ContributionHeatmap from "./ContributionHeatmap";
import ActivityTimeline from "./ActivityTimeline";
import type { GithubRepo, RepoSummaryResponse, GithubProfile } from "@/lib/github/types";

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#2f2a24]">Charts & Visualizations</h2>
      <div className="grid gap-6 md:grid-cols-2">
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
