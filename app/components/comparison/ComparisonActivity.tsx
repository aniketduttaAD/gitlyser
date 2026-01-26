"use client";

import ContributionHeatmap from "../ContributionHeatmap";
import ActivityTimeline from "../ActivityTimeline";
import type { GithubProfile } from "@/lib/github/types";

type ComparisonActivityProps = {
  profiles: GithubProfile[];
};

export default function ComparisonActivity({ profiles }: ComparisonActivityProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-[#2f2a24]">Activity Comparison</h3>

      {/* Contribution Heatmaps */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-[#2f2a24]">Contribution Heatmaps</h4>
        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((profile) => (
            <div key={profile.login} className="space-y-2">
              <h5 className="text-sm font-medium text-[#6f665b]">@{profile.login}</h5>
              <ContributionHeatmap username={profile.login} profileCreatedAt={profile.created_at} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timelines */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-[#2f2a24]">Activity Timelines</h4>
        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((profile) => (
            <div key={profile.login} className="space-y-2">
              <h5 className="text-sm font-medium text-[#6f665b]">@{profile.login}</h5>
              <ActivityTimeline username={profile.login} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
