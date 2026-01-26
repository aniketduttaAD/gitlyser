"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartContainer from "./ChartContainer";
import { getRepoSizeDistribution } from "@/lib/utils/chartData";
import type { GithubRepo } from "@/lib/github/types";

type RepoSizeChartProps = {
  repos: GithubRepo[];
  loading?: boolean;
};

export default function RepoSizeChart({ repos, loading }: RepoSizeChartProps) {
  const data = getRepoSizeDistribution(repos);

  if (data.length === 0 && !loading) {
    return (
      <ChartContainer title="Repository Size Distribution" loading={loading}>
        <p className="text-sm text-[#6f665b] text-center py-8">No repository data available</p>
      </ChartContainer>
    );
  }

  const maxLabelLength = Math.max(...data.map((d) => d.name.length));
  const bottomMargin = Math.max(120, 60 + maxLabelLength * 3);

  return (
    <ChartContainer title="Repository Size Distribution" loading={loading}>
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
          <YAxis stroke="#2f2a24" tick={{ fill: "#2f2a24", fontSize: 13, fontWeight: 500 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fbf7f0",
              border: "1px solid #e2d6c8",
              borderRadius: "8px",
            }}
            formatter={(value: number | undefined) => [value ?? 0, "Repositories"]}
          />
          <Bar dataKey="count" fill="#4f6d6a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
