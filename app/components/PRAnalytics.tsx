"use client";

import { useState, useEffect } from "react";
import { Clock, GitMerge, TrendingUp, Users } from "lucide-react";
import type { PRAnalytics } from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";

type PRAnalyticsProps = {
  owner: string;
  repo: string;
  data?: PRAnalytics | null;
  loading?: boolean;
  error?: string | null;
};

const COLORS = ["#4f6d6a", "#6f8a87", "#8fa7a4", "#afc4c1", "#cfdad7"];

export default function PRAnalytics({
  owner,
  repo,
  data: externalData,
  loading: externalLoading,
  error: externalError,
}: PRAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PRAnalytics | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData && !externalLoading);
  const [error, setError] = useState<string | null>(externalError ?? null);

  useEffect(() => {
    if (externalData !== undefined) {
      setTimeout(() => {
        setAnalytics(externalData);
        setError(externalError ?? null);
        setLoading(false);
      }, 0);
      return;
    }

    if (externalLoading) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/github/pr-analytics?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch PR analytics");
        }
        const data = (await response.json()) as PRAnalytics;
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PR analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [owner, repo, externalData, externalLoading, externalError]);

  if (loading) {
    return <ChartSkeleton />;
  }

  if (error || !analytics) {
    return (
      <div className="rounded-xl border border-[#efc6c0] bg-[#f9ebe8] p-4 text-sm text-[#a24f45] shadow-sm">
        {error || "No PR analytics available"}
      </div>
    );
  }

  const prSizeData = [
    { name: "Small (<100)", value: analytics.prSizeAnalysis.small },
    { name: "Medium (100-500)", value: analytics.prSizeAnalysis.medium },
    { name: "Large (>500)", value: analytics.prSizeAnalysis.large },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#2f2a24] uppercase tracking-wide">PR Analytics</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GitMerge className="h-3.5 w-3.5 text-[#6f665b]" />
            <span className="text-xs text-[#7a7064]">Total PRs</span>
          </div>
          <p className="text-lg font-bold text-[#2f2a24]">{analytics.totalPRs}</p>
        </div>
        <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#6f665b]" />
            <span className="text-xs text-[#7a7064]">Success Rate</span>
          </div>
          <p className="text-lg font-bold text-[#2f2a24]">{analytics.successRate}%</p>
        </div>
        <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="h-3.5 w-3.5 text-[#6f665b]" />
            <span className="text-xs text-[#7a7064]">Avg Review Time</span>
          </div>
          <p className="text-lg font-bold text-[#2f2a24]">
            {analytics.averageReviewTurnaroundTime > 0
              ? `${Math.round(analytics.averageReviewTurnaroundTime)}h`
              : "N/A"}
          </p>
        </div>
        <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users className="h-3.5 w-3.5 text-[#6f665b]" />
            <span className="text-xs text-[#7a7064]">Active Reviewers</span>
          </div>
          <p className="text-lg font-bold text-[#2f2a24]">{analytics.activeReviewers.length}</p>
        </div>
      </div>

      {/* PR Size Distribution */}
      <div className="rounded-lg border border-[#e2d6c8] bg-[#fffdf8] p-3 shadow-sm">
        <h4 className="text-xs font-semibold text-[#5f564d] mb-2 uppercase tracking-wide">
          PR Size Distribution
        </h4>
        <div className="flex items-center justify-center gap-4 text-xs text-[#6f665b]">
          {prSizeData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
