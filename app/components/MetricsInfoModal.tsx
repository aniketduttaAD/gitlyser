"use client";

import { useState, useEffect, useRef } from "react";
import { LuInfo, LuX } from "react-icons/lu";

type MetricsInfoModalProps = {
  variant?: "default" | "floating";
};

export default function MetricsInfoModal({ variant = "default" }: MetricsInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const buttonClassName =
    variant === "floating"
      ? "flex items-center justify-center h-12 w-12 rounded-full border border-[#cfdad7] bg-[#e9efee] text-[#4f6d6a] transition-all hover:border-[#b8c6c3] hover:bg-[#d9e5e4] shadow-lg"
      : "flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-[#cfdad7] bg-[#e9efee] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] flex-shrink-0 shadow-sm";

  return (
    <>
      {/* Mobile: Icon only, Desktop: Icon + Text */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        aria-label="View metrics information"
      >
        <LuInfo
          className={variant === "floating" ? "h-5 w-5" : "h-4 w-4 sm:h-4 sm:w-4"}
          aria-hidden="true"
        />
        {variant !== "floating" && <span className="hidden sm:inline">Info</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="w-full sm:w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e2d6c8] flex-shrink-0 sticky top-0 bg-[#fbf7f0] z-10">
              <h2 className="text-base sm:text-xl font-semibold text-[#2f2a24]">
                Metrics & Calculations
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#f3ede4] active:bg-[#e2d6c8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f6d6a] focus:ring-offset-1 touch-manipulation"
                aria-label="Close"
              >
                <LuX className="h-5 w-5 sm:h-5 sm:w-5 text-[#6f665b]" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 overscroll-contain">
              <div className="space-y-6 text-xs sm:text-sm pb-4">
                {/* App Description - Mobile Only */}
                <div className="sm:hidden rounded-lg border border-[#e2d6c8] bg-[#f3ede4] p-3 mb-2">
                  <p className="text-xs text-[#5f564d] leading-relaxed">
                    Surface the story behind any GitHub profile. Search for a user or organization
                    to explore repository summaries, tech stack signals, and pull request activity
                    grouped by base branch.
                  </p>
                </div>

                {/* PR Analytics */}
                <section>
                  <h3 className="font-bold text-sm sm:text-base text-[#2f2a24] mb-3 pb-2 border-b border-[#e2d6c8]">
                    PR Analytics
                  </h3>
                  <div className="space-y-2.5 text-[#5f564d]">
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Total PRs</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Count of all pull requests (open, closed, merged) fetched from the
                        repository. Analyzes up to 50 most recent PRs for detailed metrics.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Success Rate</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Percentage calculated as{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          (Merged PRs / Total PRs) × 100
                        </code>
                        . Higher rates indicate better PR quality and collaboration.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Avg Review Time</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Average hours from PR creation to first review submission. Calculated from
                        actual review submission timestamps (
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          submitted_at
                        </code>
                        ). Analyzes up to 50 most recent PRs. Excludes PRs with review times &gt;720
                        hours (30 days) and filters outliers using IQR (Interquartile Range) method.
                        Lower values indicate faster review cycles.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Active Reviewers
                      </strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Number of unique contributors who have submitted reviews on PRs. Counts
                        actual review submissions from PR reviews API (not PR authors). Analyzes up
                        to 50 most recent PRs. Shows top 10 most active reviewers based on review
                        submission count.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        PR Size Distribution
                      </strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Breakdown by total lines changed (additions + deletions). Categories:{" "}
                        <strong>Small</strong> (&lt;100 lines), <strong>Medium</strong> (100-500
                        lines), <strong>Large</strong> (&gt;500 lines). Only displayed when data is
                        available.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Repository Health Score */}
                <section>
                  <h3 className="font-bold text-sm sm:text-base text-[#2f2a24] mb-3 pb-2 border-b border-[#e2d6c8]">
                    Repository Health Score (0-100)
                  </h3>
                  <div className="space-y-2.5 text-[#5f564d]">
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Documentation (0-30 points)
                      </strong>
                      <ul className="ml-3 mt-1 space-y-1 list-disc text-xs sm:text-sm">
                        <li>README length: 5-15 points (100-2000+ chars)</li>
                        <li>CONTRIBUTING.md: +5 points</li>
                        <li>CHANGELOG.md: +5 points</li>
                        <li>CODE_OF_CONDUCT.md: +5 points</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Maintenance (0-25 points)
                      </strong>
                      <ul className="ml-3 mt-1 space-y-1 list-disc text-xs sm:text-sm">
                        <li>Recent commits (last 30 days): 5-15 points (0-20+ commits)</li>
                        <li>Commit frequency: 2-10 points (based on overall activity)</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Community (0-20 points)
                      </strong>
                      <ul className="ml-3 mt-1 space-y-1 list-disc text-xs sm:text-sm">
                        <li>Stars: 2-8 points (10-1000+ stars)</li>
                        <li>Forks: 2-6 points (10-100+ forks)</li>
                        <li>Open issues: up to 6 points (based on issue count)</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Issue Response (0-15 points)
                      </strong>
                      <ul className="ml-3 mt-1 space-y-1 list-disc text-xs sm:text-sm">
                        <li>
                          Resolution time: 4-15 points (&lt;24h to &lt;720h). Calculated as average
                          time from issue creation to closure for closed issues (analyzes up to 30
                          most recent issues)
                        </li>
                        <li>
                          Resolution rate: up to 5 bonus points. Percentage of closed issues out of
                          total issues
                        </li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">
                        Code Quality (0-10 points)
                      </strong>
                      <ul className="ml-3 mt-1 space-y-1 list-disc text-xs sm:text-sm">
                        <li>LICENSE file: +3 points</li>
                        <li>CI/CD setup detected: +4 points</li>
                        <li>Wiki enabled: +1 point</li>
                        <li>GitHub Pages: +1 point</li>
                        <li>Forking allowed: +1 point</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Code Quality Metrics */}
                <section>
                  <h3 className="font-bold text-sm sm:text-base text-[#2f2a24] mb-3 pb-2 border-b border-[#e2d6c8]">
                    Code Quality Metrics
                  </h3>
                  <div className="space-y-2.5 text-[#5f564d]">
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Avg Review</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Average time to first PR review (hours). Calculated from time between PR
                        creation and first review submission timestamp (
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          submitted_at
                        </code>
                        ). Uses IQR (Interquartile Range) outlier filtering for accuracy. Analyzes
                        up to 50 most recent PRs. Excludes review times &gt;720 hours. Lower values
                        indicate faster code review cycles.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Avg Churn</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Average lines changed per commit. Calculated as{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          (Total lines changed / Number of commits)
                        </code>
                        . Excludes merge commits (detected by commit message patterns) and very
                        small changes (&lt;5 lines total). Analyzes up to 100 most recent commits
                        from default branch. Lower values suggest smaller, focused commits which are
                        easier to review.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Deps</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Dependency health from package files. Checks:{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          package.json
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          requirements.txt
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          pyproject.toml
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          Cargo.toml
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          go.mod
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          Gemfile
                        </code>
                        . Dependencies using version ranges (
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          ^
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          ~
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          &gt;
                        </code>
                        ,{" "}
                        <code className="bg-[#f3ede4] px-1 py-0.5 rounded text-[0.65rem] sm:text-[0.7rem]">
                          &lt;
                        </code>
                        ) or wildcards instead of exact versions are considered outdated.
                      </p>
                    </div>
                    <div>
                      <strong className="text-[#2f2a24] text-xs sm:text-sm">Code Churn</strong>
                      <p className="ml-0 mt-0.5 text-xs sm:text-sm leading-relaxed">
                        Daily code change trends (additions - deletions) over last 30 days.
                        Calculated from commit statistics. Excludes merge commits (detected by
                        commit message patterns) and changes &lt;5 lines total. Analyzes up to 100
                        most recent commits from default branch. Visualizes development activity and
                        code evolution patterns. Shows net change per day.
                      </p>
                    </div>
                  </div>
                </section>

                {/* AI Analysis */}
                <section>
                  <h3 className="font-bold text-sm sm:text-base text-[#2f2a24] mb-3 pb-2 border-b border-[#e2d6c8]">
                    AI Analysis (Optional)
                  </h3>
                  <p className="mb-4 text-[#5f564d] bg-[#f3ede4] p-3 rounded-lg border border-[#e2d6c8] text-xs sm:text-sm leading-relaxed">
                    <strong className="text-[#2f2a24]">Privacy Note:</strong> AI features use
                    OpenAI&apos;s GPT-4o-mini model. Your API key is stored locally in your browser
                    (localStorage) and only sent directly to OpenAI&apos;s API. No data is stored on
                    our servers.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-[#2f2a24] mb-2">
                        Repository Smart Summary
                      </h4>
                      <p className="mb-2 text-[#5f564d] text-xs sm:text-sm">
                        The following repository data is sent to OpenAI:
                      </p>
                      <div className="bg-[#f3ede4] p-3 rounded-lg border border-[#e2d6c8]">
                        <ul className="space-y-1.5 text-[0.65rem] sm:text-xs text-[#5f564d]">
                          <li>
                            <strong className="text-[#2f2a24]">Name:</strong> Repository name
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Description:</strong> Repository
                            description if available
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Languages:</strong> Top 6 languages
                            with code volume (KB/MB)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Tech Stack:</strong> Detected
                            technologies (up to 8 items)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Topics:</strong> Repository topics
                            (up to 6)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">License:</strong> License type if
                            available
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Homepage:</strong> Repository
                            homepage URL if available
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Stats:</strong> Open issues count,
                            forks (network count), watchers (subscribers count), repository size in
                            MB
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Features:</strong> Template repo
                            status, GitHub Pages, Wiki, Discussions enabled
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Structure:</strong> Top 10
                            directories, top 8 file types/extensions with counts, detected features
                            (tests, docs, CI/CD, Docker, config files)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">README:</strong> Full README content
                            (cleaned: badges/images removed, TOC removed, max 6000 chars, priority
                            sections prioritized). Only included if README exists and length &gt;50
                            chars
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Additional Docs:</strong> Up to 2
                            markdown files (CONTRIBUTING.md, CHANGELOG.md, API docs prioritized),
                            max 1500 chars each, filtered by content length (&gt;100 chars)
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-[#2f2a24] mb-2">
                        Profile Comparison Analysis
                      </h4>
                      <p className="mb-2 text-[#5f564d] text-xs sm:text-sm">
                        The following profile and repository data is sent to OpenAI:
                      </p>
                      <div className="bg-[#f3ede4] p-3 rounded-lg border border-[#e2d6c8]">
                        <ul className="space-y-1.5 text-[0.65rem] sm:text-xs text-[#5f564d]">
                          <li>
                            <strong className="text-[#2f2a24]">Profile Info:</strong> Username
                            (@login), name, bio, company, location, member since date, years active,
                            account type (User/Organization)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Repository Metrics:</strong> Total
                            repositories, total stars received, total forks, open issues count,
                            unique languages count, average repository size in MB, repositories with
                            recent activity (last 90 days)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Language Distribution:</strong> Top
                            10 languages by code volume (with KB/MB), language breakdown by
                            repository count (top 8 languages)
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Top Repositories:</strong> Top 8
                            repositories by stars, including: name, stars count, forks count,
                            primary language, creation date, topics (up to 5), description (first
                            120 chars), open issues count
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Social Metrics:</strong> Followers
                            count, following count, follower-to-following ratio
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">Engagement Metrics:</strong> Average
                            stars per repository, average forks per repository, most starred
                            repository name and star count
                          </li>
                          <li>
                            <strong className="text-[#2f2a24]">For Role Matching:</strong> Job
                            description requirements and role expectations (when provided)
                          </li>
                        </ul>
                        <p className="mt-3 pt-2 border-t border-[#e2d6c8] text-[#5f564d] italic text-[0.65rem] sm:text-xs">
                          <strong className="text-[#2f2a24]">Analysis Types:</strong> Overall
                          comparison, Technical skills comparison, Role match comparison (with job
                          description)
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
