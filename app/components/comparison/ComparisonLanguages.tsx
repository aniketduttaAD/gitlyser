"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { GithubRepo } from "@/lib/github/types";

type ComparisonLanguagesProps = {
  profiles: { login: string }[];
  reposList: GithubRepo[][];
};

const COLORS = ["#4f6d6a", "#6f8a87", "#8fa7a4", "#afc4c1", "#cfdad7"];

export default function ComparisonLanguages({ profiles, reposList }: ComparisonLanguagesProps) {
  const languageData = profiles.map((profile, index) => {
    const repos = reposList[index] || [];
    const langMap = new Map<string, number>();

    repos.forEach((repo) => {
      if (repo.language) {
        langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
      }
    });

    const topLanguages = Array.from(langMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      profile: profile.login,
      languages: topLanguages,
    };
  });

  if (languageData.every((data) => data.languages.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">Language Distribution</h3>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {languageData.map((data) => (
          <div key={data.profile} className="space-y-2">
            <h4 className="text-sm font-semibold text-[#5f564d] uppercase tracking-wide">
              @{data.profile}
            </h4>
            {data.languages.length > 0 ? (
              <div className="[&_text]:!fill-[#2f2a24] [&_text]:!font-semibold [&_text]:!text-[12px]">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={data.languages}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        if (!percent || percent < 0.1) return "";
                        const percentage = (percent * 100).toFixed(0);
                        return `${name}: ${percentage}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.languages.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => {
                        const total = data.languages.reduce((sum, item) => sum + item.count, 0);
                        const percentage =
                          total > 0 ? (((value || 0) / total) * 100).toFixed(1) : "0";
                        return [`${value || 0} repos (${percentage}%)`, name || "Language"];
                      }}
                      contentStyle={{
                        backgroundColor: "#fbf7f0",
                        border: "1px solid #e2d6c8",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[#6f665b] text-center py-8">No language data</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
