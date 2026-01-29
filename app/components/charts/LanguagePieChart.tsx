"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import ChartContainer from "./ChartContainer";
import { aggregateLanguages } from "@/lib/utils/chartData";
import type { GithubRepo, RepoSummaryResponse } from "@/lib/github/types";

type LanguagePieChartProps = {
  repos: GithubRepo[];
  summaries?: Record<string, RepoSummaryResponse>;
  loading?: boolean;
};

const COLORS = [
  "#4f6d6a",
  "#6f8a87",
  "#8fa7a4",
  "#afc4c1",
  "#cfdad7",
  "#9a8e80",
  "#7a7064",
  "#5f564d",
  "#4f453b",
  "#3f352b",
];

export default function LanguagePieChart({ repos, summaries, loading }: LanguagePieChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const data = aggregateLanguages(repos, summaries);

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
      <ChartContainer title="Language Distribution" loading={loading}>
        <p className="text-sm text-[#6f665b] text-center py-8">No language data available</p>
      </ChartContainer>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const outerRadius = isMobile ? 70 : 100;

  return (
    <ChartContainer title="Language Distribution" loading={loading}>
      <div className="[&_text]:!fill-[#2f2a24]">
        <ResponsiveContainer width="100%" height={isMobile ? 380 : 450}>
          <PieChart margin={{ top: 10, right: 10, bottom: isMobile ? 70 : 100, left: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy={isMobile ? "42%" : "45%"}
              labelLine={false}
              label={false}
              outerRadius={outerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                const val = value || 0;
                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return [`${val.toLocaleString()} bytes (${percentage}%)`, name || "Code"];
              }}
              contentStyle={{
                backgroundColor: "#fbf7f0",
                border: "1px solid #e2d6c8",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 500,
                padding: "6px 8px",
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#2f2a24",
                paddingTop: "8px",
              }}
              iconType="circle"
              verticalAlign="bottom"
              height={60}
              layout="horizontal"
              align="center"
              formatter={(value: string) => {
                const item = data.find((d) => d.name === value);
                if (!item) return value;
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return `${value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
