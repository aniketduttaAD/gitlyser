"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import { aggregateLanguages } from "@/lib/utils/chartData";
import type { GithubRepo, RepoSummaryResponse } from "@/lib/github/types";

type LanguageBarChartProps = {
  repos: GithubRepo[];
  summaries?: Record<string, RepoSummaryResponse>;
  loading?: boolean;
};

export default function LanguageBarChart({ repos, summaries, loading }: LanguageBarChartProps) {
  const data = aggregateLanguages(repos, summaries).map((item) => ({
    name: item.name,
    "Code (bytes)": item.value,
  }));

  if (data.length === 0 && !loading) {
    return (
      <ChartContainer title="Language Usage" loading={loading}>
        <p className="text-sm text-[#6f665b] text-center py-8">No language data available</p>
      </ChartContainer>
    );
  }

  const maxLabelLength = Math.max(...data.map((d) => d.name.length));
  const bottomMargin = Math.max(120, 60 + maxLabelLength * 3);

  return (
    <ChartContainer title="Language Usage" loading={loading}>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c8" />
          <XAxis
            dataKey="name"
            stroke="#2f2a24"
            tick={{ fill: "#2f2a24", fontSize: 10, fontWeight: 500 }}
            angle={-45}
            textAnchor="end"
            height={bottomMargin}
            interval={0}
            tickMargin={8}
            dy={8}
          />
          <YAxis
            stroke="#2f2a24"
            tick={{ fill: "#2f2a24", fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fbf7f0",
              border: "1px solid #e2d6c8",
              borderRadius: "8px",
            }}
            formatter={(value: number | undefined) => [
              value ? value.toLocaleString() : "0",
              "Bytes",
            ]}
          />
          <Legend />
          <Bar dataKey="Code (bytes)" fill="#4f6d6a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
