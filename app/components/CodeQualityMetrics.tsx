"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, TrendingUp, Package, AlertCircle } from "lucide-react";
import type { CodeQualityMetrics } from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";

type CodeQualityMetricsProps = {
  owner: string;
  repo: string;
  data?: CodeQualityMetrics | null;
  loading?: boolean;
  error?: string | null;
};

export default function CodeQualityMetrics({
  owner,
  repo,
  data: externalData,
  loading: externalLoading,
  error: externalError,
}: CodeQualityMetricsProps) {
  const shouldFetch = externalData === undefined && !externalLoading && !!owner && !!repo;
  const [data, setData] = useState<CodeQualityMetrics | null>(externalData ?? null);
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
      `/api/github/code-quality?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
    )
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to fetch code quality metrics");
          });
        }
        return res.json();
      })
      .then((json: CodeQualityMetrics) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load code quality metrics");
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
      <div className="rounded-lg border border-[#efc6c0] bg-[#f9ebe8] p-3 text-xs text-[#a24f45]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-[#e2d6c8] bg-[#fbf7f0] p-3 text-xs text-[#6f665b]">
        No code quality data available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e2d6c8] bg-[#fbf7f0] p-3 shadow-sm">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-[#2f2a24] uppercase tracking-wide mb-2">
          Code Quality Metrics
        </h3>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="h-3 w-3 text-[#6f665b]" />
              <span className="text-xs text-[#7a7064]">Avg Review</span>
            </div>
            <p className="text-sm font-bold text-[#2f2a24]">
              {data.averagePRReviewTime > 0 ? `${data.averagePRReviewTime.toFixed(1)}h` : "N/A"}
            </p>
          </div>
          <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="h-3 w-3 text-[#6f665b]" />
              <span className="text-xs text-[#7a7064]">Avg Churn</span>
            </div>
            <p className="text-sm font-bold text-[#2f2a24]">{data.averageChurnPerCommit}</p>
          </div>
          <div className="rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Package className="h-3 w-3 text-[#6f665b]" />
              <span className="text-xs text-[#7a7064]">Deps</span>
            </div>
            <p className="text-sm font-bold text-[#2f2a24]">
              {data.dependencyHealth.total}
              {data.dependencyHealth.outdated > 0 && (
                <span className="text-[#a24f45]"> ({data.dependencyHealth.outdated} outdated)</span>
              )}
            </p>
          </div>
        </div>

        {/* Code Churn Chart */}
        {data.codeChurn.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-[#5f564d] mb-2">Code Churn (Last 30 Days)</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={data.codeChurn} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c8" />
                <XAxis
                  dataKey="date"
                  stroke="#2f2a24"
                  tick={{ fill: "#2f2a24", fontSize: 9, fontWeight: 500 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis stroke="#2f2a24" tick={{ fill: "#2f2a24", fontSize: 9, fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fbf7f0",
                    border: "1px solid #e2d6c8",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(value: number | undefined) => (value ?? 0).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="netChange"
                  stroke="#4f6d6a"
                  strokeWidth={2}
                  dot={false}
                  name="Net Change"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[#2f2a24] flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {data.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-xs text-[#6f665b] flex items-start gap-1.5">
                  <span className="text-[#4f6d6a] mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
