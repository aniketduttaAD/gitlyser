"use client";

import { useState, useEffect } from "react";
import {
  LuCircleAlert,
  LuTrendingUp,
  LuBadgeAlert,
  LuBookOpen,
  LuUsers,
  LuMessageSquare,
  LuCode,
} from "react-icons/lu";
import type { RepoHealthScore } from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";

type RepoHealthScoreProps = {
  owner: string;
  repo: string;
  data?: RepoHealthScore | null;
  loading?: boolean;
  error?: string | null;
};

export default function RepoHealthScore({
  owner,
  repo,
  data: externalData,
  loading: externalLoading,
  error: externalError,
}: RepoHealthScoreProps) {
  const shouldFetch = externalData === undefined && !externalLoading && !!owner && !!repo;
  const [data, setData] = useState<RepoHealthScore | null>(externalData ?? null);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(externalError ?? null);

  useEffect(() => {
    if (externalData !== undefined) {
      requestAnimationFrame(() => {
        setData(externalData);
        setError(externalError ?? null);
        setLoading(false);
      });
    }
  }, [externalData, externalError]);

  useEffect(() => {
    if (externalData !== undefined || externalLoading || !owner || !repo) {
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    fetch(
      `/api/github/repo-health?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
    )
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to fetch health score");
          });
        }
        return res.json();
      })
      .then((json: RepoHealthScore) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load health score");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [owner, repo, externalData, externalLoading, externalError]);

  if (loading || externalLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#efc6c0] bg-[#f9ebe8] p-4 text-sm text-[#a24f45]">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#426a4b] bg-[#eff6f0] border-[#cfe2d1]";
    if (score >= 60) return "text-[#4f6d6a] bg-[#e9efee] border-[#cfdad7]";
    if (score >= 40) return "text-[#6f665b] bg-[#f3ede4] border-[#e2d6c8]";
    return "text-[#a24f45] bg-[#f9ebe8] border-[#efc6c0]";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const breakdownItems = [
    {
      label: "Documentation",
      value: data.breakdown.documentation,
      max: 30,
      icon: LuBookOpen,
    },
    {
      label: "Maintenance",
      value: data.breakdown.maintenance,
      max: 25,
      icon: LuTrendingUp,
    },
    {
      label: "Community",
      value: data.breakdown.community,
      max: 20,
      icon: LuUsers,
    },
    {
      label: "Issue Response",
      value: data.breakdown.issueResponse,
      max: 15,
      icon: LuMessageSquare,
    },
    {
      label: "Code Quality",
      value: data.breakdown.codeQuality,
      max: 10,
      icon: LuCode,
    },
  ];

  return (
    <div className="rounded-lg border border-[#e2d6c8] bg-[#fbf7f0] p-2.5 sm:p-3 shadow-sm overflow-hidden">
      <div className="mb-2.5 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-[#2f2a24] uppercase tracking-wide mb-2">
          Repository Health Score
        </h3>
        <div
          className={`rounded-lg border-2 p-2 sm:p-3 text-center ${getScoreColor(data.overall)}`}
        >
          <div className="text-xl sm:text-2xl font-bold">{data.overall}/100</div>
          <div className="text-[0.65rem] sm:text-xs font-medium">{getScoreLabel(data.overall)}</div>
        </div>
      </div>

      <div className="mb-2.5 sm:mb-3">
        <h4 className="text-[0.65rem] sm:text-xs font-semibold text-[#2f2a24] mb-1.5 sm:mb-2">
          Score Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
          {breakdownItems.map((item) => {
            const percentage = (item.value / item.max) * 100;
            const Icon = item.icon;

            return (
              <div key={item.label} className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between text-[0.65rem] sm:text-xs">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#6f665b] min-w-0 flex-1">
                    <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="font-semibold text-[#2f2a24] flex-shrink-0 ml-1 text-[0.65rem] sm:text-xs">
                    {item.value}/{item.max}
                  </span>
                </div>
                <div className="h-1 sm:h-1.5 bg-[#e2d6c8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4f6d6a] transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.recommendations.length > 0 && (
        <div className="space-y-1 sm:space-y-1.5">
          <h4 className="text-[0.65rem] sm:text-xs font-semibold text-[#2f2a24] flex items-center gap-1 sm:gap-1.5">
            <LuCircleAlert className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Recommendations
          </h4>
          <ul className="space-y-0.5 sm:space-y-1">
            {data.recommendations.slice(0, 3).map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-1 sm:gap-1.5 text-[0.65rem] sm:text-xs text-[#6f665b]"
              >
                <LuBadgeAlert className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#426a4b] flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2 break-words">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
