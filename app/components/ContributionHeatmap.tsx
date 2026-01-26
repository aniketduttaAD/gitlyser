"use client";

import { useState, useEffect } from "react";
import { getContributionLevel, getContributionColorClass } from "@/lib/utils/contributions";
import type { ContributionHeatmapData } from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";

type ContributionHeatmapProps = {
  username: string;
  profileCreatedAt?: string;
  loading?: boolean;
};

export default function ContributionHeatmap({
  username,
  profileCreatedAt,
  loading: externalLoading,
}: ContributionHeatmapProps) {
  const [data, setData] = useState<ContributionHeatmapData | null>(null);
  const [loading, setLoading] = useState(!externalLoading && !!username);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number } | null>(null);

  const currentYear = new Date().getFullYear();
  const availableYears: number[] = [];
  if (profileCreatedAt) {
    const createdYear = new Date(profileCreatedAt).getFullYear();
    for (let y = currentYear; y >= createdYear; y--) {
      availableYears.push(y);
    }
  } else {
    availableYears.push(currentYear);
  }

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    if (!username || externalLoading) {
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    const yearParam = `&year=${selectedYear}`;

    fetch(`/api/github/contributions?username=${encodeURIComponent(username)}${yearParam}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to fetch contributions");
          });
        }
        return res.json();
      })
      .then((json: ContributionHeatmapData) => {
        setData(json);
      })
      .catch((err) => {
        console.error("[ContributionHeatmap] Error fetching contributions:", err);
        setError(err instanceof Error ? err.message : "Failed to load contributions");
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
  }, [username, selectedYear, profileCreatedAt, externalLoading]);

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

  if (!data || data.contributions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-6 text-sm text-[#6f665b]">
        No contribution data available.
      </div>
    );
  }

  const weeks: Array<Array<{ date: string; count: number }>> = [];
  let currentWeek: Array<{ date: string; count: number }> = [];

  data.contributions.forEach((contribution, index) => {
    const date = new Date(contribution.date);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(contribution);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    if (index === data.contributions.length - 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
  });

  const monthLabels: string[] = [];
  const monthSet = new Set<string>();
  data.contributions.forEach((contribution) => {
    const date = new Date(contribution.date);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthSet.has(monthKey)) {
      monthSet.add(monthKey);
      monthLabels.push(month);
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#2f2a24]">Contribution Heatmap</h3>
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-lg border border-[#e2d6c8] bg-[#fffdf8] px-3 py-1.5 text-sm text-[#2f2a24] focus:outline-none focus:ring-2 focus:ring-[#4f6d6a]"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="text-sm text-[#6f665b]">
          {data.totalContributions} contribution{data.totalContributions !== 1 ? "s" : ""} in{" "}
          {selectedYear}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex mb-2">
            {monthLabels.map((month, index) => (
              <div
                key={index}
                className="text-xs text-[#6f665b] flex-shrink-0"
                style={{ width: `${100 / monthLabels.length}%` }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((contribution, dayIndex) => {
                  const level = getContributionLevel(
                    contribution.count,
                    data.maxDailyContributions
                  );
                  const colorClass = getContributionColorClass(level);

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${colorClass} cursor-pointer transition-all hover:scale-125 hover:ring-2 hover:ring-[#4f6d6a]`}
                      onMouseEnter={() => setHoveredDate(contribution)}
                      onMouseLeave={() => setHoveredDate(null)}
                      title={`${formatDate(contribution.date)}: ${contribution.count} contribution${contribution.count !== 1 ? "s" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#6f665b]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#ebedf0]" title="No contributions" />
          <div className="w-3 h-3 rounded-sm bg-[#9be9a8]" title="1-3 contributions" />
          <div className="w-3 h-3 rounded-sm bg-[#40c463]" title="4-6 contributions" />
          <div className="w-3 h-3 rounded-sm bg-[#30a14e]" title="7-9 contributions" />
          <div className="w-3 h-3 rounded-sm bg-[#216e39]" title="10+ contributions" />
        </div>
        <span>More</span>
      </div>

      {hoveredDate && (
        <div className="mt-2 p-2 rounded-lg border border-[#e2d6c8] bg-[#fffdf8] text-sm text-[#2f2a24]">
          <strong>{formatDate(hoveredDate.date)}</strong>: {hoveredDate.count} contribution
          {hoveredDate.count !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
