"use client";

import { useState } from "react";
import {
  LuSparkles,
  LuFileText,
  LuCode,
  LuChartBar,
  LuLoader,
  LuCircleAlert,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

type AIComparisonProps = {
  profiles: GithubProfile[];
  reposList: GithubRepo[][];
  openaiKey: string;
};

type ComparisonType = "role_match" | "technical_skills" | "overall_assessment";

export default function AIComparison({ profiles, reposList, openaiKey }: AIComparisonProps) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>("overall_assessment");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [dataUsageNote, setDataUsageNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJobInput, setShowJobInput] = useState(false);

  if (!openaiKey) {
    return (
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#6f665b]">
          <LuCircleAlert className="h-4 w-4" />
          <p className="text-sm">
            OpenAI API key required for AI comparison. Please add your key in settings.
          </p>
        </div>
      </div>
    );
  }

  const calculateReposData = () => {
    return profiles.map((profile, index) => {
      const repos = reposList[index] || [];
      const languages: Record<string, number> = {};
      let totalStars = 0;
      let totalForks = 0;
      let totalOpenIssues = 0;
      let totalSize = 0;

      repos.forEach((repo) => {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
        totalOpenIssues += repo.open_issues_count;
        totalSize += repo.size || 0;

        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + (repo.size || 0);
        }
      });

      const uniqueLanguages = new Set(repos.map((repo) => repo.language).filter(Boolean));
      const avgRepoSize = repos.length > 0 ? totalSize / repos.length : 0;

      const mostStarredRepo = repos.reduce(
        (max, repo) =>
          repo.stargazers_count > (max?.stars || 0)
            ? { name: repo.name, stars: repo.stargazers_count }
            : max,
        null as { name: string; stars: number } | null
      );

      return {
        repos: repos.map((repo) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          topics: repo.topics || [],
          created_at: repo.created_at,
          pushed_at: repo.pushed_at,
        })),
        languages,
        totalStars,
        totalForks,
        totalOpenIssues,
        languagesCount: uniqueLanguages.size,
        avgRepoSize,
        mostStarredRepo,
      };
    });
  };

  const handleCompare = async () => {
    if (comparisonType === "role_match" && !jobDescription.trim()) {
      setError("Job description is required for role matching.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setDataUsageNote(null);

    try {
      const reposData = calculateReposData();

      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openaiKey,
          comparisonType,
          jobDescription: comparisonType === "role_match" ? jobDescription : undefined,
          profiles: profiles.map((p) => ({
            login: p.login,
            name: p.name,
            bio: p.bio,
            company: p.company,
            location: p.location,
            public_repos: p.public_repos,
            followers: p.followers,
            following: p.following,
            created_at: p.created_at,
            type: p.type,
          })),
          reposData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to generate comparison.");
      }

      const data = (await response.json()) as {
        analysis: string;
        dataUsageNote: string;
        comparisonType: string;
      };

      setAnalysis(data.analysis);
      setDataUsageNote(data.dataUsageNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate comparison.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <LuSparkles className="h-5 w-5 text-[#4f6d6a]" />
          <h3 className="text-lg font-semibold text-[#2f2a24]">AI-Powered Comparison</h3>
        </div>

        <div className="space-y-4">
          {/* Comparison Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#5f564d] mb-2">Comparison Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setComparisonType("role_match");
                  setShowJobInput(true);
                }}
                className={`p-3 rounded-lg border transition text-left ${
                  comparisonType === "role_match"
                    ? "border-[#4f6d6a] bg-[#e9efee]"
                    : "border-[#e2d6c8] bg-[#fffdf8] hover:border-[#cfdad7]"
                }`}
              >
                <LuFileText className="h-4 w-4 text-[#6f665b] mb-1" />
                <p className="text-sm font-semibold text-[#2f2a24]">Role Match</p>
                <p className="text-xs text-[#6f665b]">Match against JD</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setComparisonType("technical_skills");
                  setShowJobInput(false);
                }}
                className={`p-3 rounded-lg border transition text-left ${
                  comparisonType === "technical_skills"
                    ? "border-[#4f6d6a] bg-[#e9efee]"
                    : "border-[#e2d6c8] bg-[#fffdf8] hover:border-[#cfdad7]"
                }`}
              >
                <LuCode className="h-4 w-4 text-[#6f665b] mb-1" />
                <p className="text-sm font-semibold text-[#2f2a24]">Technical Skills</p>
                <p className="text-xs text-[#6f665b]">Compare tech stack</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setComparisonType("overall_assessment");
                  setShowJobInput(false);
                }}
                className={`p-3 rounded-lg border transition text-left ${
                  comparisonType === "overall_assessment"
                    ? "border-[#4f6d6a] bg-[#e9efee]"
                    : "border-[#e2d6c8] bg-[#fffdf8] hover:border-[#cfdad7]"
                }`}
              >
                <LuChartBar className="h-4 w-4 text-[#6f665b] mb-1" />
                <p className="text-sm font-semibold text-[#2f2a24]">Overall Assessment</p>
                <p className="text-xs text-[#6f665b]">Comprehensive view</p>
              </button>
            </div>
          </div>

          {/* Job Description Input */}
          {showJobInput && (
            <div>
              <label
                htmlFor="jobDescription"
                className="block text-sm font-medium text-[#5f564d] mb-2"
              >
                Job Description
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here... Include requirements, responsibilities, required skills, and any other relevant details."
                rows={6}
                className="w-full rounded-xl border border-[#e2d6c8] bg-[#fffdf8] px-4 py-3 text-sm text-[#2f2a24] outline-none transition focus:border-[#4f6d6a] focus:ring-2 focus:ring-[#d7e1e0] resize-none"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading || (comparisonType === "role_match" && !jobDescription.trim())}
            className="w-full rounded-xl bg-[#4f6d6a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#425b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6d6a] disabled:cursor-not-allowed disabled:bg-[#cfc5b7] disabled:text-[#6f665b] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LuLoader className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <LuSparkles className="h-4 w-4" />
                <span>Generate AI Comparison</span>
              </>
            )}
          </button>

          {error && (
            <div className="rounded-xl border border-[#efc6c0] bg-[#f9ebe8] p-3 text-sm text-[#a24f45]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2f2a24] mb-4">AI Analysis Results</h3>
          <div className="prose prose-sm max-w-none prose-headings:text-[#2f2a24] prose-headings:font-semibold prose-p:text-[#2f2a24] prose-p:leading-relaxed prose-strong:text-[#2f2a24] prose-strong:font-semibold prose-ul:text-[#2f2a24] prose-ol:text-[#2f2a24] prose-li:text-[#2f2a24] prose-a:text-[#4f6d6a] prose-a:no-underline hover:prose-a:underline prose-code:text-[#2f2a24] prose-code:bg-[#f3ede4] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-blockquote:text-[#5f564d] prose-blockquote:border-[#e2d6c8]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Data Usage Note */}
      {dataUsageNote && (
        <div className="rounded-xl border border-[#cfdad7] bg-[#e9efee] p-4 text-sm text-[#5f564d]">
          <div className="flex items-start gap-2">
            <LuCircleAlert className="h-4 w-4 text-[#4f6d6a] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[#4f6d6a] mb-2">Data Considered in Analysis</p>
              <div className="prose prose-xs max-w-none prose-ul:text-[#6f665b] prose-li:text-[#6f665b] prose-strong:text-[#4f6d6a]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{dataUsageNote}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
