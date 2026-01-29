"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartContainer from "./ChartContainer";
import { getRepoSizeDistribution } from "@/lib/utils/chartData";
import type { GithubRepo } from "@/lib/github/types";

type RepoSizeChartProps = {
  repos: GithubRepo[];
  loading?: boolean;
};

export default function RepoSizeChart({ repos, loading }: RepoSizeChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const data = getRepoSizeDistribution(repos);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (data.length === 0 && !loading) {
    return (
      <ChartContainer title="Repository Size Distribution" loading={loading}>
        <p className="text-sm text-[#6f665b] text-center py-8">No repository data available</p>
      </ChartContainer>
    );
  }

  const maxLabelLength = Math.max(...data.map((d) => d.name.length));
  const bottomMargin = Math.max(100, 50 + maxLabelLength * 2.5);

  return (
    <ChartContainer title="Repository Size Distribution" loading={loading}>
      <ResponsiveContainer width="100%" height={isMobile ? 380 : 450}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c8" />
          <XAxis
            dataKey="name"
            stroke="#2f2a24"
            tick={{ fill: "#2f2a24", fontSize: 9, fontWeight: 500 }}
            angle={-45}
            textAnchor="end"
            height={bottomMargin}
            interval={0}
            tickMargin={6}
            dy={6}
            width={60}
          />
          <YAxis
            stroke="#2f2a24"
            tick={{ fill: "#2f2a24", fontSize: 10, fontWeight: 500 }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fbf7f0",
              border: "1px solid #e2d6c8",
              borderRadius: "8px",
              fontSize: "11px",
              padding: "6px 8px",
            }}
            formatter={(value: number | undefined) => [value ?? 0, "Repositories"]}
          />
          <Bar dataKey="count" fill="#4f6d6a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
